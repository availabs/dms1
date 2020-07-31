import React from "react"

import { Button } from "components/avl-components/components/Button"
import Select from "components/avl-components/components/Inputs/select"
// import { hasValue } from "components/avl-components/components/Inputs/utils"
import { useTheme } from "components/avl-components/wrappers/with-theme"

import { DmsButton } from "./dms-button"

import { dmsCreate, dmsEdit } from "../wrappers/dms-create"
import DmsWizard from "./dms-wizard"

const BadAttributeRow = ({ oldKey, value, attributes, deleteOld, mapOldToNew, ...props }) => {
  const [newAtt, setNewAtt] = React.useState(null);
  return (
    <div className="border-2 p-3 rounded-md mt-2 mr-2 last:mr-0">
      <div className="rounded border p-3">
        <div className="w-full flex mb-2">
          <div className="flex-0 mr-4">
            <div className="font-bold">
              Attribute
            </div>
            <div>
              { oldKey }
            </div>
          </div>
          <div className="flex-1">
            <div className="font-bold">
              Value
            </div>
            <div className="whitespace-pre-wrap">
              { JSON.stringify(value, null, 4) }
            </div>
          </div>
        </div>
        <Button onClick={ e => deleteOld(oldKey) } className="w-full">
          Remove Old Attribute
        </Button>
      </div>
      <div className="rounded border p-3 mt-3">
        <Select domain={ attributes }
          multi={ false }
          searchable={ true }
          onChange={ setNewAtt }
          accessor={ d => d.key }
          placeholder="Select an attribute..."
          value={ newAtt }/>
        <Button disabled={ !newAtt } className="w-full mt-2"
          onClick={ e => mapOldToNew(oldKey, newAtt.key, value) }>
          Map Old Attribute { newAtt ? `to ${ newAtt.key }` : "to..." }
        </Button>
      </div>
    </div>
  )
}
export const DmsCreateBase = ({ createState, ...props }) => {
  const theme = useTheme();
  return (
    <div>
      <DmsWizard { ...createState }>
        <form onSubmit={ e => e.preventDefault() }>
          <div className="mt-2 mb-4 max-w-2xl">
            <DmsButton className="w-1/2" large type="submit"
              action={ createState.dmsAction } props={ props }/>
          </div>
          <div className="w-full flex flex-col justify-center">
            { createState.activeSection.attributes
                .map(({ Input, key, ...att }, i) => (
                  <div key={ key }
                    className={ `border-l-4 pl-2 mb-2 pb-2
                      ${ att.fullWidth || (att.type === "richtext") || (att.type === "img") ? "w-full" : "max-w-2xl"}
                      ${ !att.verified ? theme.borderDanger : att.required ? theme.borderSuccess :
                          att.hasValue ? theme.borderInfo : "border-current" }
                      ${ att.hidden ? 'hidden' : '' }
                    ` }>
                    <label htmlFor={ att.id }>{ att.name }</label>
                    <Input value={ att.value } onChange={ att.onChange }
                      autoFocus={ i === 0 }/>
                  </div>
                ))
            }
          </div>
        </form>
      </DmsWizard>
      <div className="flex">
        { createState.badAttributes.map(att =>
          <BadAttributeRow { ...att } oldKey={ att.key }
            { ...createState }/>
        ) }
      </div>
    </div>
  );
}
export const DmsCreate = dmsCreate(DmsCreateBase);
export const DmsEdit = dmsEdit(DmsCreateBase);
