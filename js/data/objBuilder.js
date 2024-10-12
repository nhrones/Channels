
const usersJson = await (await fetch(new URL("../data/channels.json", import.meta.url))).json()

/**
 * build a dataSet from the json data
 * @param {number} size 
 * @returns {Promise} 
 */
export function buildTestDataSet (size) {
   return new Promise((resolve, _reject) => {
      size = usersJson.length
      const map = new Map()
      for (let index = 0; index < size; index++) {
         usersJson[index].ID = index
         map.set(index, usersJson[index] )
      }
      resolve(map)
   });
};
