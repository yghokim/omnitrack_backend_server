import * as mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  name: String,
  weight: Number,
  age: Number
}, {timestamps: true});

const Cat = mongoose.model('Item', itemSchema);

export default Cat;
