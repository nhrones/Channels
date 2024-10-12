
import { makeEditableRow, resetFocusedRow } from './editableTR.js'
import { buildPageButtons, } from './domPageButtons.js'
import { $, buenoCache } from '../main.js'
import { paginateData } from '../data/paginate.js'

/** 
 * @module domDataTable
 * @description  This module is a template constructor module
 * Using simple template fragments, we construct a DOM datatable.
 * @abstract - This module leverages JSDoc comments for type checking.
 * 
 * @function buildTableHead - builds the head section of our datatable.
 * @function buildDataTable - builds the datatable.
 */


/** @type {HTMLTableSectionElement} */
let tableBody

/**
 * Capitalize First Letter
 *
 * @param {string} str the string to capitalize
 * @returns {string} capitalized string
 */
function capitalizeFirstLetter(str) {
   return str.charAt(0).toUpperCase() + str.slice(1);
}

/** 
 * Build the Table header
 */
export const buildTableHead = () => {
   const tablehead = /** @type {HTMLTableSectionElement} */ ($('table-head'))
   const tr = `
<tr class="headerRow">
`;
   let th = ''
   for (let i = 0; i < buenoCache.columns.length; i++) {
      th += `    <th id="header${i + 1}" 
   data-index=${i} value=1> ${capitalizeFirstLetter(buenoCache.columns[i].name)} 
   <span class="indicator">🔃</span>
   <input id="input${i + 1}" type="text">
</th>
`;
   }
   tablehead.innerHTML += (tr + th)
   tablehead.innerHTML += `</tr>`
}

/** 
 * build and HTML table 
 */
export const buildDataTable = () => {

   if (!tableBody) {
      tableBody = /** @type {HTMLTableSectionElement} */($('table-body'))
   }

   const {
      /** @type {ArrayLike} */
      querySet,
      /** @type {number} */
      totalPages
   } = paginateData()

   tableBody.innerHTML = '';
    /** @type {HTMLHtmlElement} */($('h1')).className = 'hidden'
   if (querySet) {
      for (let i = 0; i < querySet.length; i++) {
         const obj = querySet[i]
         let row = `<tr data-row_id="${obj[buenoCache.columns[0].name]} ">
        `
         for (let i = 0; i < buenoCache.columns.length; i++) {
            const ro = (buenoCache.columns[i].readOnly) ? ' read-only' : ''
            row += `<td data-column_id="${buenoCache.columns[i].name}"${ro}>${obj[buenoCache.columns[i].name]}</td>
            `
         }
         row += '</tr>'
         tableBody.innerHTML += row
      }
   }
   resetFocusedRow()
   buildPageButtons(totalPages)
   makeEditableRow()
}
