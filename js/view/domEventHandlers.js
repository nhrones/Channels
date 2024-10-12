
import { filterData } from '../data/filter.js'
import { orderData } from '../data/order.js'
import { paginateData } from '../data/paginate.js'
import { OrderDirection } from '../data/order.js'
import { $, buenoCache } from '../main.js'
import { buildDataTable, buildTableHead } from './domDataTable.js'

/** 
 * @module domEventHandlers
 * @description  This module initialized DOM objects and their event handlers
 * @abstract - This module leverages JSDoc comments for type checking.
 * 
 * @function resetIndicators - resets Order indicator elements
 * @function initDOMelements - initializes DOM objects and event handlers.
 */


const UP = '🔼'
const DOWN = '🔽'
const UNORDERED = '🔃'

/**
 * resets Order indicator elements
 */
const resetIndicators = () => {
   const indicators = document.querySelectorAll('.indicator')
   for (const indicator of Array.from(indicators)) {
      const parent = /** @type {HTMLElement} */(indicator.parentElement);
      /** @type {DOMStringMap} */
      const { index } = /**@type {{index: string}}*/(parent.dataset)
      buenoCache.columns[index].order = OrderDirection.UNORDERED
      indicator.textContent = UNORDERED
   }
}

/** 
 * Initialize DOM elements, and attach common event handlers 
 */
export const initDOMelements = () => {

   // build the table head section first
   buildTableHead()

   /** 
    * the currently focused header input element 
    */
   let focusedInput

   // assign click handlers for column headers
   for (let i = 0; i < buenoCache.columns.length; i++) {

      const el = /** @type {HTMLElement} */($(`header${i + 1}`))
      el.onclick = (e) => {
         const { tagName } = /** @type {HTMLElement} */(e.target)
         const { ASC, DESC, UNORDERED } = OrderDirection
         if (tagName === 'INPUT') return
         const header = /** @type {HTMLElement} */(e.currentTarget)
         const indicator = /** @type {HTMLElement} */(header.querySelector('.indicator'))
         const index = parseInt(header.dataset.index + '')
         const colName = buenoCache.columns[index].name
         const currentOrder = buenoCache.columns[index].order

         if (currentOrder == UNORDERED) {
            resetIndicators()
            buenoCache.columns[index].order = ASC
            orderData(colName, ASC)
            if (indicator) indicator.textContent = DOWN
         }
         else if (currentOrder == ASC) {
            resetIndicators()
            buenoCache.columns[index].order = DESC
            orderData(colName, DESC)
            if (indicator) indicator.textContent = UP
         }
         else if (currentOrder == DESC) {
            if (indicator) indicator.textContent = UNORDERED
            buenoCache.columns[index].order = UNORDERED
            resetIndicators()
            orderData(colName, UNORDERED)
            paginateData()
         }

         buildDataTable()
      }
   }

   // assign `keyup` handlers for header input elements
   for (let i = 0; i < buenoCache.columns.length; i++) {

      const el = /** @type {HTMLInputElement} */($(`input${i + 1}`))
      el.onkeyup = () => {
         filterData(buenoCache.columns[i].name, el.value)
         if (focusedInput) {
            if (focusedInput != el) {
               focusedInput.value = ''
               focusedInput = el
            }
         } else {
            focusedInput = el
            filterData(buenoCache.columns[i].name, el.value)
         }
      }
   }
}