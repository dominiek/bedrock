import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Divider, Button, Message } from 'semantic-ui-react';
import { formatDateTime } from 'utils/date';
import { request } from 'utils/api';
import { screen } from 'helpers';
import { Confirm, HelpTip, Breadcrumbs, SearchProvider } from 'components';

import Filters from 'modals/Filters';
import EditUser from 'modals/EditUser';

import { getData } from 'country-list';
const countries = getData().map(({ code, name }) => ({
  value: code,
  text: name,
  key: code,
}));

@screen
export default class UserList extends React.Component {
  onDataNeeded = async (params) => {
    return await request({
      method: 'POST',
      path: '/1/users/search',
      body: params,
    });
  };

  render() {
    return (
      <SearchProvider onDataNeeded={this.onDataNeeded}>
        {({
          items: users,
          getSorted,
          setSort,
          filters,
          setFilters,
          reload,
        }) => {
          return (
            <React.Fragment>
              <Breadcrumbs active="Users">
                <Filters onSave={setFilters} filters={filters}>
                  <Filters.Text label="Name" name="name" />
                  <Filters.Dropdown
                    label="Country"
                    name="country"
                    options={countries}
                    search
                  />
                </Filters>
                <EditUser
                  trigger={<Button primary content="New User" icon="plus" />}
                  onSave={reload}
                />
              </Breadcrumbs>
              <Divider hidden />
              {users.length === 0 ? (
                <Message>No users created yet</Message>
              ) : (
                <Table celled sortable>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell
                        width={3}
                        onClick={() => setSort('name')}
                        sorted={getSorted('name')}>
                        Name
                      </Table.HeaderCell>
                      <Table.HeaderCell
                        width={3}
                        onClick={() => setSort('email')}
                        sorted={getSorted('email')}>
                        Email
                      </Table.HeaderCell>
                      <Table.HeaderCell
                        width={3}
                        onClick={() => setSort('roles')}
                        sorted={getSorted('roles')}>
                        Roles
                      </Table.HeaderCell>
                      <Table.HeaderCell
                        onClick={() => setSort('createdAt')}
                        sorted={getSorted('createdAt')}>
                        Joined
                        <HelpTip
                          title="Joined"
                          text="This is the date and time the user was created."
                        />
                      </Table.HeaderCell>
                      <Table.HeaderCell textAlign="center">
                        Actions
                      </Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {users.map((user) => {
                      return (
                        <Table.Row key={user.id}>
                          <Table.Cell>
                            <Link to={`/users/${user.id}`}>{user.name}</Link>
                          </Table.Cell>
                          <Table.Cell>{user.email}</Table.Cell>
                          <Table.Cell>
                            {user.roles
                              .map((r) => r.roleDefinition.name)
                              .join(', ')}
                          </Table.Cell>
                          <Table.Cell>
                            {formatDateTime(user.createdAt)}
                          </Table.Cell>
                          <Table.Cell textAlign="center">
                            <EditUser
                              user={user}
                              trigger={
                                <Button
                                  style={{ marginLeft: '20px' }}
                                  basic
                                  icon="edit"
                                />
                              }
                              onSave={reload}
                            />
                            <Confirm
                              negative
                              confirmText="Delete"
                              header={`Are you sure you want to delete "${user.name}"?`}
                              content="All data will be permanently deleted"
                              trigger={<Button basic icon="trash" />}
                              onConfirm={async () => {
                                await request({
                                  method: 'DELETE',
                                  path: `/1/users/${user.id}`,
                                });
                                reload();
                              }}
                            />
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              )}
            </React.Fragment>
          );
        }}
      </SearchProvider>
    );
  }
}
