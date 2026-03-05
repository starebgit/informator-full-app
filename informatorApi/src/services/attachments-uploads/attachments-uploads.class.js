const { errors } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.AttachmentsUploads = class AttachmentsUploads {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    return [];
  }

  async get(id, params) {
    return {
      id,
      text: 'You should use /attachments or /uploads endpoint'
    };
  }

  /**
   * Links upload_ids with attachmentId inside attachments_uploads table
   * @param {attachmentId, uploadId} data
   * @param {*} params
   * @returns result of set method
   */
  async create({ attachmentId, uploadsId, ...data }, params) {
    if (isNaN(attachmentId))
      throw new errors.BadRequest(
        'Attachment ID must be a Number',
        attachmentId
      );
    const attachments = await this.options.attachments.get(attachmentId);
    const res = await attachments.setUploads(uploadsId);
    return res;
  }

  /**
   * Replaces current links with uploadsId for given attachmentId
   * @param {*} attachmentId
   * @param {*} data
   * @param {*} params
   * @returns result of set method
   */
  async update(attachmentId, { uploadsId, ...data }, params) {
    if (isNaN(attachmentId))
      throw new errors.BadRequest('Attachment ID must be a Number', data);
    const attachments = await this.options.attachments.get(attachmentId);
    const res = await attachments.setUploads(uploadsId);
    return res;
  }

  /**
   * Adds a new link
   * @param {*} attachmentId
   * @param {*} param1
   * @param {*} params
   * @returns
   */
  async patch(attachmentId, { uploadsId, ...data }, params) {
    if (isNaN(attachmentId))
      throw new errors.BadRequest('Attachment ID must be a Number', data);
    const attachments = await this.options.attachments.get(attachmentId);
    const res = await attachments.addUploads(uploadsId);
    return res;
  }

  /**
   * Removes all links for given attachmentId
   * @param {*} attachmentId
   * @param {*} params
   * @returns
   */
  async remove(attachmentId, params) {
    if (isNaN(attachmentId))
      throw new errors.BadRequest('Attachment ID must be a Number', data);
    const attachments = await this.options.attachments.get(attachmentId);
    const { data } = await this.options.uploads.find();
    const uploadsId = data.map((upload) => upload.id);
    const res = await attachments.removeUploads(uploadsId);
    return res;
  }
};
