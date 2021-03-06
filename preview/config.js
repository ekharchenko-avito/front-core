/* eslint-disable prefer-template */
/* eslint-disable jsx-quotes */
/* eslint-disable no-underscore-dangle */
/* global __appComponents__, __appSettings__, __ownComponents__ */

import React from 'react'
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import { configure, storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'

import { create } from 'jss'
import preset from 'jss-preset-default'
import JssProvider from 'react-jss/lib/JssProvider'
import { createGenerateClassName, MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

const generateClassName = createGenerateClassName()
const jss = create(preset())
const { theme } = require(__appSettings__)

const Render = ({ children }) => (
  <div>
    <JssProvider jss={jss} generateClassName={generateClassName}>
      <CssBaseline>
        <MuiThemeProvider theme={createMuiTheme(theme)}>
          { children }
        </MuiThemeProvider>
      </CssBaseline>
    </JssProvider>
  </div>
)

const components = require.context(
  __appComponents__,
  true,
  /(.*)\/index\.(?:js|ts|tsx)$/
)

const componentsPreview = require.context(
  __appComponents__,
  true,
  /(.*)\/index\.preview\.(?:js|ts|tsx)$/
)

const coreComponents = require.context(
  __ownComponents__,
  true,
  /(.*)\/index\.(?:js|ts|tsx)$/
)

const coreComponentsPreview = require.context(
  __ownComponents__,
  true,
  /(.*)\/index\.preview\.(?:js|ts|tsx)$/
)

const getData = (prefix, comps, pres) => {
  const list = comps.keys()
    .map(f => [f, f.slice(2, -9)])
  const preList = pres.keys()
    .map(f => [f, f.slice(2, -17)])
  return list
    .map(([file, folder]) => {
      const pre = preList.find(([, f]) => f === folder)
      return {
        component: comps(file),
        folder,
        name: prefix + folder,
        preview: pre ? pres(pre[0]) : null,
      }
    })
    .filter(({ folder }) => folder)
}

const appDatas = []
  .concat(getData('app/', components, componentsPreview))

const datas = __ownComponents__ === __appComponents__ ?
  appDatas :
  appDatas.concat(getData('core/', coreComponents, coreComponentsPreview))

const loadStories = () => {
  datas
    .forEach(({ component, name, preview }) => {
      const st = storiesOf(name, module)
      const Story = component.default
      const wrap = (getProps, ix) => {
        // eslint-disable-next-line
        const { _preview, ...props } = getProps({ action })
        return (
          <Render key={ix}>
            <Story {...props} />
          </Render>
        )
      }

      if (preview) {
        if (preview.reducers) {
          const store = createStore(combineReducers(preview.reducers), preview.preloadedState || {})
          st.addDecorator(story => (<Provider store={store}>{story()}</Provider>))
        }

        const data = preview.default

        if (preview.State) {
          st.add('State', () => (
            <div className='storybook-all-wrapper'>
              <Render>
                <preview.State Target={Story} action={action} />
              </Render>
            </div>
          ))
        }

        st.add('all', () => (
          <div className='storybook-all-wrapper'>
            { data.filter(p => !p({ action })._skip).map(wrap) }
          </div>
        ))

        data.forEach((getProps, ix) => {
          st.add(`${ix}: ${getProps({ action })._preview}`, () => wrap(getProps, ix))
        })
      } else {
        st.add('empty', () => (<Render> <Story /> </Render>))
      }
    })
}

configure(loadStories, module)
