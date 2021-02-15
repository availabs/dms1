import React from "react"

const DocsPage = ({ title, chapter, body, footer, updated_at, ...props }) =>
  <div className="max-w-xl grid grid-cols-12">
    <div className="col-span-8 font-bold text-2xl leading-8">{ title }</div>
    <div className="col-span-3 font-semibold leading-8">Chapter</div>
    <div className="col-span-1 leading-8">{ chapter }</div>
    <div className="col-span-12 py-3 px-5 border-2 rounded-lg my-2 w-full">{ body }</div>
    <div className="col-span-3 font-semibold">Updated At:</div>
    <div className="col-span-9 mb-2">{ updated_at }</div>
  </div>
export default DocsPage;
