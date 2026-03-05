const { errors } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.NoticesKeywords = class NoticesKeywords {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    return [];
  }

  async get(id, params) {
    return {
      id,
      text: `A new message with ID: ${id}!`
    };
  }

  async create({ noticeId, keywordsId, ...data }, params) {
    if (isNaN(noticeId))
      throw new errors.BadRequest('Notice ID must be a Number', noticeId);
    const notices = await this.options.notices.get(noticeId);
    const res = await notices.setKeywords(keywordsId);
    return res;
  }

  async update(noticeId, { keywordsId, ...data }, params) {
    if (isNaN(noticeId))
      throw new errors.BadRequest('Notice ID must be a Number', data);
    const notices = await this.options.notices.get(noticeId);
    const res = await notices.setKeywords(keywordsId);
    return res;
  }

  async patch(noticeId, { keywordsId, ...data }, params) {
    if (isNaN(noticeId))
      throw new errors.BadRequest('Notice ID must be a Number', noticeId);
    const notices = await this.options.notices.get(noticeId);
    const res = await notices.addkeywords(keywordsId);
    return res;
  }

  async remove(noticeId, params) {
    if (isNaN(noticeId))
      throw new errors.BadRequest('Notice ID must be a Number', noticeId);
    const notices = await this.options.notices.get(noticeId);
    const { data } = await this.options.keywords.find();
    const keywordsId = data.map((keyword) => keyword.id);
    const res = await notices.removeKeywords(keywordsId);
    return res;
  }
};
