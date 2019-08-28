import React from 'react'
import HomePageLayout from '../components/HomePageLayout'
import { IGatsbyProps } from '../util/interfaces';

const NotFoundPage = (props: IGatsbyProps) => (
  <HomePageLayout location={props.location}>
    <h1>NOT FOUND</h1>
    <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
  </HomePageLayout>
)

export default NotFoundPage
