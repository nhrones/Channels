
import { buildTestDataSet } from './objBuilder.js'
import { paginateData } from './paginate.js'
import { buildDataTable } from '../view/domDataTable.js'

const LOG = true

//==========================================================
//                     Bueno-Cache
//           A persisted in-memory data cache
//      Hydrated from a worker-hosted async-IndexedDB
//    All mutations are asynchronously persisted to IDB
//==========================================================

/**
 * This `In-Memory-cache` leverages ES6-Maps.    
 * It uses a promisified `worker-IDB` for persistance.    
 * 
 * The persistance service leverages IndexedDB in a worker. 
 * We wrap the workers messaging in order to support promises.    
 * 
 * Performance is achieved by persisting and hydrating    
 * the cache (es6-Map-entries) as a single JSON string     
 * in the IndexedDB.    
 *  
 * Persisting 100,000 objects(10.7 MB) takes ~ 90 ms.    
 * Note that most of this time is `off-thread` (worker). 
 * 
 * Hydration of 100,000 objects(10.7 MB) takes ~ 300 ms.    
 * Hydration happens only once on start-up and is also     
 * mostly(DB-Fetch) `off-thread` (worker).    
 * This includes: DB-Fetch, JSON.parse, and Map-loading.
 */
export class BuenoCache {

   IDB_KEY = ''
   schema
   nextMsgID = 0
   querySet = []
   callbacks

   /** 
    * the web-worker that this instance communicates with
    *
    * @type {Worker}
    */
   idbWorker

   size = 0

   /** @type {string | any[]} */
   columns = []


   /**
    * @type {Map<number, string>} dbMap
    */
   dbMap = new Map()

   /** @type {any[]} */
   raw = []

   currentPage = 1
   rows = 10
   window = 10

   /**
    *  BuenoCache ctor
    * @param {{ schema: {  name: string, sample: {[key: string]: any}}, size: number; }} opts
    */
   constructor(opts) {
      this.IDB_KEY = `${opts.schema.name}-${opts.size}`
      this.schema = opts.schema
      this.idbWorker = new Worker('./js/idbWorker.js')
      this.callbacks = new Map()
      this.columns = this.buildColumnSchema(this.schema.sample)
      this.size = opts.size
      // When we get a message from the worker we expect 
      // an object containing {txID, error, and result}.
      // We find the callback that was registered for this transaction(txID), 
      // and call it with the error and result properities.
      // This will resolve or reject the promise that was
      // returned to the client when the callback was created.
      this.idbWorker.onmessage = (evt) => {
         const { txID, error, result } = evt.data     // unpack
         if (!this.callbacks.has(txID)) return        // check
         const callback = this.callbacks.get(txID)    // fetch
         this.callbacks.delete(txID)                  // clean up
         if (callback) callback(error, result)        // execute
      }

      // initial data fetch and hydrate
      this.hydrate().then((result) => {
         // no data found in IDB
         if (result === null) {
            const h1 = document.getElementById('h1')
            if (h1) {
               h1.textContent = `Creating test dataset with - ${opts.size} users! Please Wait!`
               h1.className = 'h1'
            }
            // build a new dataset for this size
            buildTestDataSet(opts.size).then((val) => {
               this.persist(val)
               this.hydrate()
            })
         }
      })
   }

   /**
    * extract a set of column-schema from the DB.schema object
    * @param {{ [s: string]: any; } | ArrayLike<any>} obj
    */
   buildColumnSchema(obj) {
      const columns = []
      for (const [key, value] of Object.entries(obj)) {
         let read_only = false;
         if ((typeof value === 'number' && value === -1) ||
            (typeof value === 'string' && value === 'READONLY')) {
            read_only = true
         }
         columns.push({
            name: `${key}`,
            type: `${typeof value}`,
            readOnly: read_only,
            order: 'UNORDERED'
         })
      }
      return columns
   }

   /**
    * Persist the current dbMap to an IndexedDB using         
    * our webworker. (takes ~ 90 ms for 100k records)    
    * This is called for any mutation of the dbMap (set/delete)
    * @param {Map<number, any>} map
    */
   async persist(map) {
      const valueString = JSON.stringify(Array.from(map.entries()))
      const persistStart = performance.now()
      // transfering a single large string to/from a worker is very performant!
      await this.postMessage({ procedure: 'SET', key: this.IDB_KEY, value: valueString })
      const persistTime = (performance.now() - persistStart).toFixed(2)
      if (LOG) console.log(`Persisting ${map.size} records took ${persistTime} ms `)
   }

   /**
    * build Missing Data -> buildTestDataSet -> persist -> RPC-GET
    */
   buildMissingData() {
      buildTestDataSet(this.size).
         then((val) => {
            console.log(`MissingData value type: ${typeof val}`)
         })
   }

   /**
    * hydrate a dataset from a single raw record stored in IndexedDB    
    * hydrating 100,000 objects takes ~ 295ms :      
    *     DB-Fetch: 133.00ms    
    *     JSON.Parse: 145.30ms    
    *     Build-Map: 16.80ms        
    */
   async hydrate() {
      const fetchStart = performance.now()
      const result = await this.postMessage({ procedure: 'GET', key: this.IDB_KEY })
      if (result === 'NOT FOUND') {
         return null
      } else {
         //const fetchTime = (performance.now() - fetchStart).toFixed(2)
         let records
         //const parseStart = performance.now()
         if (typeof result === 'string') records = JSON.parse(result)
         //const parseTime = (performance.now() - parseStart).toFixed(2)
         //const mapStart = performance.now()
         this.dbMap = new Map(records)
         //const mapTime = (performance.now() - mapStart).toFixed(2)
         //const totalTime = (performance.now() - fetchStart).toFixed(2)
         //       if (LOG) console.log(`Hydrating ${this.dbMap.size} records
         //       DB-Fetch: ${fetchTime}ms 
         //       JSON.Parse: ${parseTime}ms 
         //       Build-CacheMap: ${mapTime}ms 
         //  Total: ${totalTime}ms`)

         this.raw = [...this.dbMap.values()]
         this.querySet = [...this.raw]
         paginateData()
         buildDataTable()
         return "ok"
      }
   }

   /** 
    * resest the working querySet to original DB values 
    */
   resetData() {
      this.querySet = [...this.raw]
   }

   /** 
    * find an object from a string key 
    * @param {Map<string, number[]>} map
    * @param {string} value
    * @param {boolean} [partial]
    */
   findString(
      map,
      value,
      partial = false
   ) {
      for (const key of map.keys()) {
         if (typeof key === 'string')
            if (partial) {
               if (key.startsWith(value)) return map.get(key)
            } else {
               if (key === value) return map.get(key)
            }
      };
      return `${value} not found!`
   }

   /**
    * find an object from a number key
    *
    * @param {Map<number, number[]>} map
    * @param {number} value
    * @returns {(string | number[])}
    */
   findNumber(map, value) {
      for (const key of map.keys()) {
         if (key === value) return map.get(key) ?? []
      };
      return `${value} not found!`
   }

   /**
    * The `set` method mutates - will call the `persist` method.
    *
    * @param {number} key
    * @param {any} value
    * @returns {string}
    */
   set(key, value) {
      //console.log(`set key ${key} val ${JSON.stringify(value)}`)
      try {
         this.dbMap.set(key, value)
         this.persist(this.dbMap)
         this.hydrate()
         //console.log('Did set!', key)
         return key.toString()
      } catch (e) {
         console.error('error putting ')
         return 'Error ' + e
      }
   }

   /**
    * The `get` method will not mutate records
    *
    * @param {number} key
    * @returns {*}
    */
   get(key) {
      try {
         return this.dbMap.get(key)
      } catch (e) {
         return 'Error ' + e
      }
   }

   /**
    * The `delete` method mutates - will call the `persist` method.
    *
    * @param {number} key
    * @returns {*}
    */
   delete(key) {
      try {
         const result = this.dbMap.delete(key)
         if (result === true) this.persist(this.dbMap)
         this.hydrate()
         return result
      } catch (e) {
         return 'Error ' + e
      }
   }

   /**
    * Post a message to our IDB webworker     
    * 
    * We give each message a unique transaction id.    
    * We then create/save a promise callback for the id.    
    * Finally, we return a promise for this callback.   
    * Our dbWorker will signal when the rpc has been fulfilled.   
    * At that time we lookup our callback, and fulfill the promise.    
    * This is how we implement async transactions with    
    * our IndexedDB. Since most of the heavy lifting is    
    * on the worker, we never block the UI 
    *
    * @param {{ procedure: 'GET' | 'SET', key: string, value?: string }} newMessage
    * @returns {Promise<any>}
    */
   postMessage(newMessage) {
      const newID = this.nextMsgID++
      return new Promise((resolve, reject) => {
         // store the promise callback for this id
         this.callbacks.set(newID, (error, result) => {
            if (error) reject(new Error(error.message))
            resolve(result)
         })
         this.idbWorker.postMessage({ callID: newID, payload: newMessage })
      })
   }
}
