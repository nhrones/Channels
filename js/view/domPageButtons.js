
import { buildDataTable } from './domDataTable.js'
import { focusedRow } from './editableTR.js'
import { $, buenoCache } from '../main.js'
import { paginateData } from '../data/paginate.js'

/** 
 * @module domPageButtons
 * @description  Builds all required pagination button elements
 * as well as the required click event handlers.
 * @abstract - This module leverages JSDoc comments for type checking.
 * 
 * @function buildPageButtons - builds all required pagination button elements
 */

/** @type {HTMLElement} */
let wrapper

/** @type {HTMLButtonElement} */
export let deleteBtn

/** @type {HTMLButtonElement} */
export let addBtn

/**
 * build page buttons
 *
 * @export
 * @param {number} pages
 */
export function buildPageButtons(pages) {
   if (!wrapper) {
      wrapper = /** @type {HTMLElement} */($('page-wrapper'))
   }
   const { currentPage, window } = buenoCache
   wrapper.innerHTML = `` // start fresh
   let maxLeft = (currentPage - Math.floor(window / 2))
   let maxRight = (currentPage + Math.floor(window / 2))

   if (maxLeft < 1) {
      maxLeft = 1
      maxRight = window
   }

   if (maxRight > pages) {
      maxLeft = pages - (window - 1)
      if (maxLeft < 1) maxLeft = 1;
      maxRight = pages
   }

   // build numbered page buttons
   for (let page = maxLeft; page <= maxRight; page++) {
      // highlight the current-page button    
      const classString = (currentPage === page) ? `"pagebtn currentpagebtn"` : "pagebtn"
      wrapper.innerHTML += `<button 
            value=${page} 
            class=${classString}>${page}
        </button>`
   }

   // build first page button
   if (currentPage != 1) {
      wrapper.innerHTML = `<button 
        value=${1}
        class="pagebtn endbtn">« First</button>` + wrapper.innerHTML
   }

   // build last page button
   if (currentPage != pages) {
      wrapper.innerHTML += `<button 
            value=${pages}
            class="pagebtn endbtn">Last »</button>`
   }

   wrapper.innerHTML += `<div> <button id='addbtn' class='rowbtn'>Add Row</button>
    <button id='deletebtn' class='rowbtn' hidden> X </button></div>`
   addBtn = /**@type {HTMLButtonElement}*/($('addbtn'))
   addBtn.onclick = (_e) => {
      //console.log('addBtn clicked!')
      const newRow = Object.assign({}, buenoCache.schema.sample)
      if (newRow.id) {
         newRow.id = buenoCache.dbMap.size
      }
      //console.info(newRow)
      //console.log('before add thisDB.size ', buenoCache.dbMap.size)
      buenoCache.set(newRow.id, newRow)
      //console.info('after add thisDB.size ', buenoCache.dbMap.size)
   }

   deleteBtn = /**@type {HTMLButtonElement}*/($('deletebtn'))
   deleteBtn.onclick = (_e) => {
      // delete the map row, then persist the map
      const id = /**@type {HTMLTableRowElement}*/(focusedRow).dataset.row_id
      buenoCache.delete(parseInt(id + ''))
      paginateData()
      buildDataTable()
   }


   // add a click handler to each new button
   const pageCollection = document.querySelectorAll('.pagebtn')
   for (let i = 0; i < pageCollection.length; i++) {
      pageCollection[i].addEventListener('click', function () {
         buenoCache.currentPage = Number( /**@type {HTMLButtonElement}*/(pageCollection[i]).value)
         paginateData()
         buildDataTable()
      });
   }

}