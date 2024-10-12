
const DB_NAME = "workDB";
const STORE_NAME = "ObjectStore";
let objectStore = null;

//TODO typedef for msg id, err, result

/**
 * Post a message
 * @param {number} callID
 * @param {string | null} error
 * @param {any} result
 */
function post(callID, error, result) {
   if (error) {
      console.error("Worker caught an error:", error);
      self.postMessage({ txID: callID, error: error, result: null });
   } else if (result === void 0) {
      console.info("Not Found!");
      self.postMessage({ txID: callID, error: null, result: "NOT FOUND" });
   } else {
      self.postMessage({ txID: callID, error: null, result });
   }
}


self.onmessage = function (evt) {
   const data = evt.data;
   const { callID, payload } = data;
   const { procedure, key, value } = payload;
   switch (procedure) {
      case "SET":
         set(key, value).then(() => {
            post(callID, null, "saved - " + key);
         }).catch((_e) => {
            post(callID, "error saving - " + key, null);
         });
         break;
      case "GET":
         get(key).then((val) => {
            post(callID, null, val);
         }).catch((_e) => {
            post(callID, "error getting - " + key, null);
         });
         break;
      default: {
         const errMsg = `Oppps: idbWorker got an unknown proceedure call - "procedure"`;
         post(callID, errMsg, null);
         console.error(errMsg);
      }
         break;

   }
}

function promisifyRequest(request) {
   return new Promise((resolve, reject) => {
      request.oncomplete = request.onsuccess = () => resolve(request.result);
      request.onabort = request.onerror = () => reject(request.error);
   });
}

async function createStore(dbName, storeName) {
   const request = indexedDB.open(dbName);
   request.onupgradeneeded = () => request.result.createObjectStore(storeName);
   const db = await promisifyRequest(request);
   return (txMode, callback) => {
      return callback(db.transaction(storeName, txMode).objectStore(storeName));
   };
}

async function getStore() {
   if (!objectStore)
      objectStore = await createStore(DB_NAME, STORE_NAME);
   return objectStore;
}

async function set(key, value) {
   return (await getStore())("readwrite", (store) => promisifyRequest(store.put(value, key)));
}

async function get(key) {
   return (await getStore())("readonly", (store) => promisifyRequest(store.get(key)));
}
