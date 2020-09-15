

import config from "./config"

export default {
  path: "/dms-docs",
  mainNav: true,
  // exact: true,
  auth: true,
  name: 'DMS Docs',
  icon: 'fas fa-sticky-note',
  layoutSettings: {
    nav: 'side',
    fixed: true,
    headerBar: false,
    theme: 'TEST_THEME'
  },
  component: config
}
