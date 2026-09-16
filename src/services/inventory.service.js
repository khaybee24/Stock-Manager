const StockMovement = require('../models/StockMovement');

async function changeStock({
  product,
  delta,
  type,
  reference,
  note,
  user,
}) {
  const previousQuantity = product.quantity;
  const newQuantity = previousQuantity + delta;

  // Prevent stock from going below zero
  if (newQuantity < 0) {
    throw new Error(`Insufficient stock for ${product.screenCode}`);
  }

  // Update product quantity
  product.quantity = newQuantity;

  await product.save();

  // Record the stock movement
  await StockMovement.create({
    user,
    product: product._id,
    type,
    quantity: Math.abs(delta),
    previousQuantity,
    newQuantity,
    reference,
    note,
  });

  return product;
}

module.exports = {
  changeStock,
};