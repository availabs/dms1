const DocsFormat = {
  app: "dms",
  type: "dms-docs",

  sections: [
    { title: "Main Page",
      attributes: [
        { key: "title",
          type: "text",
          required: true
        },
        { key: "body",
          type: "textarea",
          required: true
        },
        { key: "chapter",
          type: "text",
          required: true,
          verify: "^\\d+([.]\\d+)*$"
        },
        { key: 'tags',
          type: 'text',
          isArray: true
        }
      ]
    }
  ]
}
export default DocsFormat;
