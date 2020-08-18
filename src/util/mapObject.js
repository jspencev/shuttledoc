/**
 * Maps through each key:value pair in an object asyncronously.
 * 
 * @param {Object} obj - The object to iterate through.
 * @param {function} iterator - Async function to call on each iteration.
 */
export default async function mapObject(obj, iterator) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = obj[key];
    await iterator(val, key);
  }
}
