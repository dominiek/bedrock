import React from 'react';
import { observer, inject } from 'mobx-react';
import { Switch, Route, Link } from 'react-router-dom';
import AppWrapper from 'components/AppWrapper';
import { Container, Divider, Breadcrumb, Button } from 'semantic-ui-react';

import { Layout } from 'components/Layout';
import PageLoader from 'components/PageLoader';
import Overview from './Overview';
import Products from './Products';
import EditShop from 'components/modals/EditShop';

import Menu from './Menu';

@inject('shops')
@observer
export default class Shop extends React.Component {
  state = {
    itemId: this.props.match.params.id
  };

  componentDidMount() {
    this.props.shops.fetchItem(this.state.itemId);
  }

  render() {
    const { shops } = this.props;
    const item = shops.get(this.state.itemId);

    return (
      <AppWrapper>
        <Container>
          <Layout horizontal center spread>
            <Breadcrumb size="big">
              <Breadcrumb.Section link as={Link} to="/">
                Home
              </Breadcrumb.Section>
              <Breadcrumb.Divider icon="right chevron" />
              <Breadcrumb.Section link as={Link} to="/shops">
                Shops
              </Breadcrumb.Section>
              <Breadcrumb.Divider icon="right chevron" />
              <Breadcrumb.Section active>
                {item ? item.name : 'Loading...'}
              </Breadcrumb.Section>
            </Breadcrumb>
            <EditShop
              initialValues={item}
              trigger={
                <Button
                  primary
                  icon="setting"
                  content="Settings"
                />
              }
            />
          </Layout>
        </Container>
        <Divider hidden />
        <Menu itemId={this.state.itemId} />
        <Divider hidden />
        {!item && <PageLoader />}
        {item && (
          <Switch>
            <Route
              exact
              path="/shops/:id/products"
              component={(props) => <Products {...props} shop={item} />}
            />
            <Route
              exact
              path="/shops/:id"
              item={item}
              component={(props) => <Overview {...props} shop={item} />}
            />
          </Switch>
        )}
      </AppWrapper>
    );
  }
}
