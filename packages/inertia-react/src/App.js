import HeadContext from './HeadContext'
import PageContext from './PageContext'
import { createHeadManager, Inertia } from '@inertiajs/inertia'
import { createElement, useEffect, useMemo, useState } from 'react'

export default function App({
  children,
  initialPage,
  initialComponent,
  resolveComponent,
  titleCallback,
  onHeadUpdate,
}) {
  const [current, setCurrent] = useState({
    component: initialComponent || null,
    page: initialPage,
    key: null,
  })

  const headManager = useMemo(() => {
    return createHeadManager(
      typeof window === 'undefined',
      titleCallback || (title => title),
      onHeadUpdate || (() => {}),
    )
  }, [])

  useEffect(() => {
    Inertia.init({
      initialPage,
      resolveComponent,
      swapComponent: async ({ component, page, preserveState }) => {
        setCurrent(current => ({
          component,
          page,
          key: preserveState ? current.key : Date.now(),
        }))
      },
    })

    Inertia.on('navigate', () => headManager.forceUpdate())
  }, [])

  if (!current.component) {
    return createElement(HeadContext.Provider, { value: headManager }, createElement(PageContext.Provider, { value: current.page }, null))
  }

  const renderChildren = children || (({ Component, props, key }) => {
    const child = createElement(Component, { key, ...props })

    if (typeof Component.layout === 'function') {
      return Component.layout(child)
    }

    if (Array.isArray(Component.layout)) {
      return Component.layout
        .concat(child)
        .reverse()
        .reduce((children, Layout) => createElement(Layout, { children, ...props }))
    }

    return child
  })

  return createElement(HeadContext.Provider, { value: headManager }, createElement(PageContext.Provider, { value: current.page }, renderChildren({
    Component: current.component,
    key: current.key,
    props: current.page.props,
  })))
}

App.displayName = 'Inertia'
