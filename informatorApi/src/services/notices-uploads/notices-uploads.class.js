const { errors } = require('@feathersjs/errors');
/* eslint-disable no-unused-vars */
exports.NoticesUploads = class NoticesUploads {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    return [];
  }

  async get(id, params) {
    return {
      id,
      text: `You should use /notices or /uploads end-point.`
    };
  }

  /**
   * Links upload_ids with noticeId inside notices_uploads table
   * @param {noticeId, uploadId} data
   * @param {*} params
   * @returns result of set method
   */
  async create({ noticeId, uploadsId, ...data }, params) {
    if (isNaN(noticeId))
      throw new errors.BadRequest('Notice ID must be a Number', noticeId);
    const notices = await this.options.notices.get(noticeId);
    const res = await notices.setUploads(uploadsId);
    return res;
  }

  /**
   * Replaces current links with uploadsId for given noticeId
   * @param {*} noticeId
   * @param {*} data
   * @param {*} params
   * @returns result of set method
   */
  async update(noticeId, { uploadsId, ...data }, params) {
    if (isNaN(noticeId))
      throw new errors.BadRequest('Notice ID must be a Number', data);
    const notices = await this.options.notices.get(noticeId);
    const res = await notices.setUploads(uploadsId);
    return res;
  }

  /**
   * Adds a new link
   * @param {*} noticeId
   * @param {*} param1
   * @param {*} params
   * @returns
   */
  async patch(noticeId, { uploadsId, ...data }, params) {
    if (isNaN(noticeId))
      throw new errors.BadRequest('Notice ID must be a Number', data);
    const notices = await this.options.notices.get(noticeId);
    const res = await notices.addUploads(uploadsId);
    return res;
  }

  async remove(noticeId, params) {
    if (isNaN(noticeId))
      throw new errors.BadRequest('Notice ID must be a Number', data);
    const notices = await this.options.notices.get(noticeId);
    const { data } = await this.options.uploads.find();
    const uploadsId = data.map((upload) => upload.id);
    const res = await notices.removeUploads(uploadsId);
    return res;
  }
};
