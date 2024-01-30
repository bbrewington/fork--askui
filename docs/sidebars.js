/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  // docsSidebar: [{ type: 'autogenerated', dirName: 'general' }],
  apiSidebar: [{ type: 'autogenerated', dirName: 'api' }],

  // But you can create a sidebar manually
  docsSidebar: [
    'general/Getting Started/start',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Installing AskUI',
          collapsed: true,
          className: 'menu_category_installing_askui',
          items: [
            'general/Getting Started/Installing AskUI/getting-started',
            'general/Getting Started/Installing AskUI/getting-started-linux',
            'general/Getting Started/Installing AskUI/getting-started-macos',
            'general/Getting Started/Installing AskUI/getting-started-android'
          ],
        },
        'general/Getting Started/write-your-first-instruction',
        'general/Getting Started/configure_test_framework',
        'general/Getting Started/enterprise-checklist',
        'general/Getting Started/whats-next'
      ],
    },
    {
      type: 'category',
      label: 'Components',
      collapsed: true,
      className: 'menu_category_components',
      items: [
        'general/Components/guide-how-askui-works',
        'general/Components/AskUI-Development-Environment',
        'general/Components/Remote-Device-Controller',
        'general/Components/AskUI-Runner',
        'general/Components/AskUI-Installer',
        'general/Components/Supported-Keys',
        'general/Components/askui-ui-control-client',
        'general/Components/askui-ui-controller',
      ],
    },
    {
      type: 'category',
      label: 'Element Selection',
      collapsed: true,
      className: 'menu_category_element_selection',
      items: [
        'general/Element Selection/annotations-and-screenshots',
        'general/Element Selection/assertions',
        'general/Element Selection/automation-recorder',
        'general/Element Selection/multi-language-support',
        'general/Element Selection/prompt-selectors',
        'general/Element Selection/relational-selectors',
        'general/Element Selection/scraping-and-storing-lements',
        'general/Element Selection/tables',
        'general/Element Selection/text-and-element-selectors',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      collapsed: true,
      className: 'menu_category_integrations',
      items: [
        'general/Integrations/SSO',
        'general/Integrations/containers',
        'general/Integrations/continuous-integration',
        'general/Integrations/custom-web-hooks',
        'general/Integrations/databases',
        'general/Integrations/device-farms',
        'general/Integrations/reporting',
        'general/Integrations/visual-regression',
      ],
    },
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: true,
      className: 'menu_category_tutorials',
      items: [
        'general/Tutorials/android-search-in-browser',
        'general/Tutorials/flutter-android-sample-app',
        'general/Tutorials/google-cat-search',
        'general/Tutorials/index',
        'general/Tutorials/shop-demo',
        'general/Tutorials/spotify-tutorial',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      collapsed: true,
      className: 'menu_category_troubleshooting',
      items: [
        'general/Troubleshooting/cannot_find_element_error',
        'general/Troubleshooting/deprecated-endpoints',
        'general/Troubleshooting/index',
        'general/Troubleshooting/ipv6',
        'general/Troubleshooting/jest',
        'general/Troubleshooting/linux',
        'general/Troubleshooting/mac-os',
        'general/Troubleshooting/proxy',
        'general/Troubleshooting/windows',
      ],
    },
    {
      type: 'doc',
      id: 'general/Terminology',
      className: 'menu_category_terminology',
    },
    {
      type: 'link',
      label: 'Release Notes',
      href: '/release-notes',
      className: 'menu_category_release_notes' 
    }
  ],
};

module.exports = sidebars;
