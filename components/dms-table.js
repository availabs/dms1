import React from "react"

import { DmsButton } from "./dms-button"

import { Table } from 'components/avl-components/components'

import get from "lodash.get"

import { makeFilter, prettyKey, getValue, useDmsColumns } from "../utils"

const DmsTable = ({ sortBy, sortOrder, columns, initialPageSize, Container, ...props }) => {
	const [attributes, actions] = useDmsColumns(columns);

  const filter = makeFilter(props),
    dataItems = (filter ? props.dataItems.filter(filter) : props.dataItems);

  const getAttributeName = att => {
    att = att.split(/[:.]/).pop();
    const name = get(props, ["format", "attributes"], [])
      .reduce((a, c) => c.key === att ? (c.name || prettyKey(c.key)) : a, att);
    return name === att ? prettyKey(att) : name;
  };

  const columnData = [
    // add attributes
    ...attributes
      .map(({ path, key, format, Cell, ...rest }) => {
        return {
          id: key,
          accessor: d => d[key],
          Header: getAttributeName(key),
					Cell: ({ value, ...others }) =>
						Cell ? <Cell value={ format(value) } { ...others }/> : format(value),
					...rest
        }
      }),
    ...actions
      .map(a => {
        return {
					...a,
          accessor: a.action,
					disableFilters: true,
					disableSortBy: true,
          Cell: cell =>
						<div className="flex justify-end">
	            <DmsButton action={ a } item={ cell.row.original.self }
	              buttonTheme={ props.buttonTheme }/>
						</div>
        }
      })
  ]

  const data = dataItems
    .map(self => ({
      self,
      ...attributes.reduce((a, c) => {
				const { value, key } = getValue(c.path, { self }, { preserveKeys: true });
        a[key] = value;
        return a;
      }, {}),
      ...actions.reduce((o, a) => {
        o[a.action] = a;
        return o
      }, {}),
			onClick: props.makeOnClick('dms:view', self.id),
			subRows: []
    }))
// console.log("DATA ITEMS:", dataItems)
  return !props.dataItems.length ? null : (
    <Table data={ data }
      columns={ columnData }
			sortBy={ sortBy }
			sortOrder={ sortOrder }
			initialPageSize={ initialPageSize }/>
  )
}
DmsTable.defaultProps = {
  dmsAction: "list",
  dataItems: [],
  columns: [],
  filter: false,
  sortBy: "updated_at",
  sortOrder: "desc",
  initialPageSize: 10,
  striped: false
}
export default DmsTable;
