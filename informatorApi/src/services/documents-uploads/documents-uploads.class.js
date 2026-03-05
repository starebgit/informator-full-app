const { errors } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.DocumentsUploads = class DocumentsUploads {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    return [];
  }

  async get(id, params) {
    return {
      id,
      text: 'You should use /documents or /uploads endpoint'
    };
  }

  /**
   * Links upload_ids with documentId inside documents_uploads table
   * @param {documentId, uploadId} data
   * @param {*} params
   * @returns result of set method
   */
  async create({ documentId, uploadsId, ...data }, params) {
    if (isNaN(documentId))
      throw new errors.BadRequest('Document ID must be a Number', documentId);
    const documents = await this.options.documents.get(documentId);
    const res = await documents.setUploads(uploadsId);
    return res;
  }

  /**
   * Replaces current links with uploadsId for given documentId
   * @param {*} documentId
   * @param {*} data
   * @param {*} params
   * @returns result of set method
   */
  async update(documentId, { uploadsId, ...data }, params) {
    if (isNaN(documentId))
      throw new errors.BadRequest('Document ID must be a Number', data);
    const documents = await this.options.documents.get(documentId);
    const res = await documents.setUploads(uploadsId);
    return res;
  }

  /**
   * Adds a new link
   * @param {*} documentId
   * @param {*} param1
   * @param {*} params
   * @returns
   */
  async patch(documentId, { uploadsId, ...data }, params) {
    if (isNaN(documentId))
      throw new errors.BadRequest('Document ID must be a Number', data);
    const documents = await this.options.documents.get(documentId);
    const res = await documents.addUploads(uploadsId);
    return res;
  }

  /**
   * Removes all links for given documentId
   * @param {*} documentId
   * @param {*} params
   * @returns
   */
  async remove(documentId, params) {
    if (isNaN(documentId))
      throw new errors.BadRequest('Document ID must be a Number', data);
    const documents = await this.options.documents.get(documentId);
    const { data } = await this.options.uploads.find();
    const uploadsId = data.map((upload) => upload.id);
    const res = await documents.removeUploads(uploadsId);
    return res;
  }
};
