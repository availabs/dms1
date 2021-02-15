import DMS_DOCS from "./dms-docs.type"

import DocsPage from "./docs-page"

const Config = ({
  type: "dms-content",
  wrappers: [
// wrapper order is important
// from index zero to i, higher index wrappers send props into lower index wrappers
// higher index wrappers do not see props from lower index wrappers
    "dms-manager",
    { type: "dms-provider",
      options: {
        buttonThemes: {
          home: "buttonInfo"
        },
        authRules: {
          create: {
            args: ["props:user.authLevel"],
            comparator: al => +al === 10
          },
          edit: {
            args: ["props:user.authLevel"],
            comparator: al => +al === 10
          },
          delete: {
            args: ["props:user.authLevel"],
            comparator: al => +al === 10
          }
        }
      }
    },
    "dms-router",
    "show-loading", // receives loading prop
    "dms-falcor", // generates loading prop and passes to children
    "with-auth"
  ],
  props: { format: DMS_DOCS },
  children: [
    { type: "dms-header",
      props: { title: "Dms Docs" }
    },
// dms-manager children are special
// they are only shown when the dms-manager state.stack.top.action === child.props.dmsAction
    { type: "dms-table", // generic dms component for viewing multiple data items
      props: {
        dmsAction: "list",

        sortBy: "chapter",
        sortOrder: "asc",

        filter: {
          args: ["self:data.chapter"],
          comparator: arg => /^\d+$/.test(arg)
        },

        columns: [
          { path: "title",
            filter: "fuzzyText"
          },
          "chapter",
          "dms:edit",
          { action: "api:delete",
            label: "API delete",
            showConfirm: true }
        ]
      }
    },

    { type: DocsPage, // generic dms component for viewing a single data item
      props: { dmsAction: "view" },
      wrappers: [
        { type: "dms-view",
          options: {
            actions: [
              ["dms:edit", "dms:delete"],
              ["dms:create"]
            ],
            mapDataToProps: {
              // $preserveKeys: true,
// mapDataToProps is used by dms-view to map data items to wrapped component props
// prop: [...attributes]
// in this case, the dms-card is expecting title and body props.
              title: "item:data.title",
              chapter: "item:data.chapter",
              body: "item:data.body",
              updated_at: "item:updated_at"
            }
          }
        }
      ],
      children: [
        { type: "dms-table",
          props: {
            columns: [
              { path: "title",
                filter: "fuzzyText"
              },
              "chapter", "dms:edit", "dms:delete"
            ],
            sortBy: "chapter",
            sortOrder: "asc",
            filter: {
              args: ["props:dms-docs.data.chapter", "self:data.chapter"],
              comparator: (arg1, arg2) => {
                const regex = new RegExp(`^${ arg1 }[.]\\d+$`)
                return regex.test(arg2);
              }
            }
          },
          wrappers: ["dms-consumer"]
        }
      ]
    },

    { type: "dms-create",
      props: { dmsAction: "create" },
      wrappers: ["with-auth"]
    },

    { type: "dms-edit",
      props: { dmsAction: "edit" },
      wrappers: ["with-auth"]
    },

    { type: DocsPage,
      props: { dmsAction: "delete" },
      wrappers: [
        { type: "dms-view",
          options: {
            mapDataToProps: {
              title: "item:data.title",
              chapter: "item:data.chapter",
              body: "item:data.body",
              updated_at: "item:updated_at"
            },
            actions: ["api:delete"]
          }
        }
      ]
    }
  ]
})
export default Config;
