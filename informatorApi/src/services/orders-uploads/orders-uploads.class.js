const { errors } = require('@feathersjs/errors');

/* eslint-disable no-unused-vars */
exports.OrdersUploads = class OrdersUploads {
  constructor(options) {
    this.options = options || {};
  }

  async find(params) {
    return [];
  }

  async get(id, params) {
    return {
      id,
      text: `You should use /orders or /uploads EP`
    };
  }

  async create({ orderId, uploadsId, ...data }, params) {
    if (isNaN(orderId))
      throw new errors.BadRequest('Order ID must be a Number', orderId);
    const orders = await this.options.orders.get(orderId);
    const res = await orders.setUploads(uploadsId);
    return res;
  }

  async update(orderId, { uploadsId, ...data }, params) {
    if (isNaN(orderId))
      throw new errors.BadRequest('Order ID must be a Number', orderId);
    const orders = await this.options.orders.get(orderId);
    const res = await orders.setUploads(uploadsId);
    return res;
  }

  async patch(orderId, { uploadsId, ...data }, params) {
    if (isNaN(orderId))
      throw new errors.BadRequest('Order ID must be a Number', orderId);
    const orders = await this.options.orders.get(orderId);
    const res = await orders.addUploads(uploadsId);
    return res;
  }

  async remove(orderId, params) {
    if (isNaN(orderId))
      throw new errors.BadRequest('Order ID must be a Number', data);
    const orders = await this.options.orders.get(orderId);
    const { data } = await this.options.uploads.find();
    const uploadsId = data.map((upload) => upload.id);
    const res = await orders.removeUploads(uploadsId);
    return res;
  }
};
