const { errors } = require('@feathersjs/errors');

exports.DigitalizationUploads = class DigitalizationUploads  {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    return [];
  }

  async get(id, params) {
    return {
      id,
      text: `You should use /digitalization or /uploads end-point.`
    };
  }

  /**
   * Links upload_ids with digitalizationId inside digitalization_uploads table
   * @param {digitalizationId, uploadId} data
   * @param {*} params
   * @returns result of set method
   */

  async create({ digitalizationId, uploadsId, ...data }, params) {
    if (isNaN(digitalizationId))
      throw new errors.BadRequest('Digitalization ID must be a Number', digitalizationId);
    const digitalization = await this.options.digitalization.get(digitalizationId);
    const res = await digitalization.setUploads(uploadsId);
    return res;
  }

  /**
   * Replaces current links with uploadsId for given digitalizationId
   * @param {*} digitalizationId
   * @param {*} data
   * @param {*} params
   * @returns result of set method
   */

  async update(digitalizationId, { uploadsId, ...data }, params) {
    if (isNaN(digitalizationId))
      throw new errors.BadRequest('Digitalization ID must be a Number', data);
    const digitalization = await this.options.digitalization.get(digitalizationId);
    const res = await digitalization.setUploads(uploadsId);
    return res;
  }

  /**
   * Adds a new link
   * @param {*} digitalizationId
   * @param {*} param1
   * @param {*} params
   * @returns
   */

  async patch(digitalizationId, { uploadsId, ...data }, params) {
    if (isNaN(digitalizationId))
      throw new errors.BadRequest('Digitalization ID must be a Number', data);
    const digitalization = await this.options.digitalization.get(digitalizationId);
    const res = await digitalization.addUploads(uploadsId);
    return res;
  }

  async remove(digitalizationId, params) {
    if (isNaN(digitalizationId))
      throw new errors.BadRequest('Digitalization ID must be a Number', data);
    const digitalization = await this.options.digitalization.get(digitalizationId);
    const { data } = await this.options.uploads.find();
    const uploadsId = data.map((upload) => upload.id);
    const res = await digitalization.removeUploads(uploadsId);
    return res;
  }
};