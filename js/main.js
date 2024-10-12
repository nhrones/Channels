
import { initDOMelements } from './view/domEventHandlers.js'
import { BuenoCache } from './data/buenoCache.js'  
  
export const $ = (id) => document.getElementById(id)
  
/** 
 * A DB options object 
 * @member {schema} schema - used to describe the dataset.
 * @member {number} size - the size of our test dataset.   
 *    If a data set of that size is not currently   
 *    found in IndexedDB, one will be created.
*/ 
const options  = { 
    schema: {name:'Channels', sample:{ ID: -1, Call_Sign: ' ', Affiliate: ' ', Virtual_Channel: 0, Keep: ' ', Band: ' ' , Heading: ' ', Distance: ' ', Strength: ' ' }},
    size: 180, // use this to set the size of our test dataset
}  
     
/** 
 * If a dataset of this size already exists in IDB, open it.   
 * Else, create a new dataset of this size and persist it to IDB.   
 * @param object options - the schema and size of the test dataset.
 * @returns -
 * */
export const buenoCache = new BuenoCache(options) 
 
/**
 * Initialize the DataTable UI
 * This will setup for async dataload and paginate in DB-ctor
 */ 
initDOMelements()
