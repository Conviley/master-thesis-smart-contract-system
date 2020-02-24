import React from 'react'
import { Menu } from 'semantic-ui-react'
import { Link } from '../routes'

export default () => {
  return (
    <Menu>
      <Link route="/">
        <a className="item">De-Rail</a>
      </Link>

      <Menu.Menu position="right">
        <Link route="/">
          <a className="item">Trips</a>
        </Link>

        <Link route="/">
          <a className="item">+</a>
        </Link>
      </Menu.Menu>
    </Menu>
  )
}
