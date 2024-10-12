
import { buildDataTable } from '../view/domDataTable.js'
import {buenoCache } from '../main.js'
import { applyOrder} from './order.js'
import { paginateData } from './paginate.js'

/**
 * filter our dataSet
 *
 * @param {string} columnName
 * @param {string} value
 */
export const filterData = (columnName, value) => {
    buenoCache.resetData()
    if (value.length === 0) {
        applyOrder()
        paginateData()
        buildDataTable()
        return
    } else {
        let filteredData = []
        buenoCache.querySet.forEach((row) => {
            let it = row[columnName]
            if (typeof it === 'number') {
                if (it.toFixed(0).startsWith(value.toString())) {
                    filteredData.push(row)
                }
            } else {
                if (it.toLowerCase().startsWith(value.toLowerCase())) {
                    filteredData.push(row)
                }
            }
        })
        buenoCache.querySet = filteredData
        paginateData()
        buildDataTable() 
    }


}
