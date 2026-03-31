const errors = require('@feathersjs/errors');const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path'); // <-- added

/* eslint-disable no-unused-vars */
exports.MdocsDocumentation = class MdocsDocumentation {
  constructor(options) {
    this.options = options || {};

    // <-- changed: make ca.pem path robust (works regardless of CWD)
    const caPath = path.resolve(__dirname, '../../../config/ca.pem');
    if (!fs.existsSync(caPath)) {
      throw new Error(`MDOCS CA file missing: ${caPath}`);
    }

    const httpsAgent = new https.Agent({
      keepAlive: true, // <-- added (optional but helpful)
      ca: fs.readFileSync(caPath) // <-- changed
      // cert removed: ca.pem is NOT a client cert
    });

    this.instance = axios.create({
      httpsAgent,
      timeout: 20000 // <-- added: fail fast so you don't wait forever
    });
  }

  async find(params) {
    let session;
  
    try {
      // 1) LOGIN
      let loginRes;
      try {
        loginRes = await this.instance.post(this.options.url + '/user/login', {
          ...this.options.auth
        });
      } catch (err) {
        console.error('[MDOCS LOGIN FAILED]', {
          url: err?.config?.url,
          method: err?.config?.method,
          status: err?.response?.status,
          code: err?.code,
          message: err?.message,
          response: err?.response?.data
        });
        throw new errors.Unavailable(
          `MDOCS login failed: ${err?.response?.status ? 'HTTP ' + err.response.status : (err?.code || err?.message)}`
        );
      }
  
      session = loginRes.data?.session;
      if (!session) {
        console.error('[MDOCS LOGIN NO SESSION]', loginRes.data);
        throw new errors.Unavailable('MDOCS login returned no session');
      }
  
      const headers = { sessionId: session };
  
      // 2) REPORT2
      let reportRes;
      try {
        reportRes = await this.instance.post(
          this.options.url + '/file/report2',
          {
            filetypes: ['IsoDocument'],
            columns: ['Id', '%title%'],
            filter: "AuditState='valid'"
          },
          { headers }
        );
      } catch (err) {
        console.error('[MDOCS REPORT2 FAILED]', {
          url: err?.config?.url,
          method: err?.config?.method,
          status: err?.response?.status,
          code: err?.code,
          message: err?.message,
          request: err?.config?.data,      // what we sent
          response: err?.response?.data    // what MDOCS returned (this is what we need)
        });
  
        // don't let logout failure crash anything
        this.logout(session).catch(() => {});
  
        throw new errors.Unavailable(
          `MDOCS report2 failed: ${err?.response?.status ? 'HTTP ' + err.response.status : (err?.code || err?.message)}`
        );
      }
  
      const report = reportRes.data?.report;
  
      if (!report) {
        console.error('[MDOCS REPORT2 NO REPORT]', reportRes.data);
        throw new errors.NotFound('No data found');
      }
  
      return {
        count: report.rows,
        data: report.hits.map((row) => ({
          id: row.columns[0],
          title: row.columns[1]
        }))
      };
    } finally {
      await this.logout(session);
    }
  }

  async get(id, params) {
    const { documentId } = params.query || {};
    //Login
    const { session } = await this.instance
      .post(this.options.url + '/user/login', {
        ...this.options.auth
      })
      .then(({ data }) => {
        return data;
      });

    const headers = {
      sessionId: session
    };

    const { getFileInfoResponse } = await this.instance
      .post(
        this.options.url + '/file/info',
        {
          fileId: id,
          allFields: false,
          allAttributes: false,
          wishedFieldNames: ['Id']
        },
        {
          headers
        }
      )
      .then(({ data }) => {
        return data;
      });

    if (!documentId) {
      await this.logout(session);
      return getFileInfoResponse;
    }

    const file = await this.instance
      .post(
        this.options.url + '/document/get',
        {
          documentId,
          fileId: id
        },
        {
          headers
        }
      )
      .then(({ data }) => {
        return data;
      });

    await this.logout(session);

    return file;
  }

  async create(data, params) {
    return data;
  }

  async update(id, data, params) {
    return data;
  }

  async patch(id, data, params) {
    return data;
  }

  async remove(id, params) {
    return { id };
  }

  async logout(session) {
    if (!session) return; // <-- added

    try {
      await this.instance.get(this.options.url + '/user/logout', {
        headers: { sessionId: session },
        timeout: 5000 // <-- added: don't hang on logout
      });
    } catch (e) {
      // <-- added: prevent unhandled rejections
    }
  }
};