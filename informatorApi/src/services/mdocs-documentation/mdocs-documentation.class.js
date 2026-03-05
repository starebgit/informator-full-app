const { errors } = require('@feathersjs/errors');
const axios = require('axios');
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
    let session; // <-- added

    try {
      //Login
      const loginRes = await this.instance.post(this.options.url + '/user/login', {
        ...this.options.auth
      });

      session = loginRes.data?.session;
      if (!session) {
        throw new errors.Unavailable('MDOCS login returned no session');
      }

      const headers = {
        sessionId: session
      };

      const reportRes = await this.instance.post(
        this.options.url + '/file/report2',
        {
          filetypes: ['IsoDocument'],
          columns: ['Id', '%title%'],
          filter: "AuditState='valid'"
        },
        {
          headers
        }
      );

      const report = reportRes.data?.report;

      if (!report) {
        throw new errors.NotFound('No data found');
      }

      return {
        count: report.rows,
        data: report.hits.map((row) => {
          return {
            id: row.columns[0],
            title: row.columns[1]
          };
        })
      };
    } catch (err) {
      // <-- changed: surface real error fast
      const status = err?.response?.status;
      const detail =
        status ? `HTTP ${status}` :
        err?.code ? err.code :
        err?.message || 'Unknown error';

      throw new errors.Unavailable(`MDOCS find() failed: ${detail}`);
    } finally {
      // <-- changed: logout never blocks response
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