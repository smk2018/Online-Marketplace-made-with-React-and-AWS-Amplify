import React from "react";
import { API, graphqlOperation } from "aws-amplify";
import { createMarket } from "../graphql/mutations";
// prettier-ignore
import { Form, Button, Dialog, Input, Select, Notification } from 'element-react'
import { UserContext } from "../App";

class NewMarket extends React.Component {
  state = {
    addMarketDialog: false,
    marketName: "",
    options: [],
    tags: ["Arts", "Technology", "Crafts", "Entertainment"],
    selectedTags: []
  };

  handleAddMarket = async (event, user) => {
    try {
      event.preventDefault();
      this.setState({ addMarketDialog: false });
      const input = {
        name: this.state.marketName,
        tags: this.state.selectedTags,
        owner: user.username
      };
      const result = await API.graphql(
        graphqlOperation(createMarket, { input })
      );
      console.info(`Created market: id ${result.data.createMarket.id}`);
      this.setState({ marketName: "" });
    } catch (err) {
      Notification.error({
        title: "Error",
        message: `${err.message || "Error adding market"}`
      });
    }
  };

  handleFilterTags = query => {
    const filteredTags = this.state.tags
      .map(tag => ({ value: tag, label: tag }))
      .filter(tag => tag.label.toLowerCase().includes(query.toLowerCase()));
    this.setState({ options: filteredTags });
  };

  render() {
    const { marketName, options } = this.state;

    return (
      <UserContext.Consumer>
        {({ user }) => (
          <>
            <div className="market-header">
              <h1 className="market-title">
                Create Your MarketPlace
                <Button
                  className="market-title-button"
                  icon="edit"
                  type="text"
                  onClick={() => this.setState({ addMarketDialog: true })}
                />
              </h1>

              <Form inline={true} onSubmit={this.props.handleSearch}>
                <Form.Item>
                  <Input
                    placeholder="Search Markets..."
                    value={this.props.searchTerm}
                    onChange={this.props.handleSearchChange}
                    icon="circle-cross"
                    onIconClick={this.props.handleClearSearch}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="info"
                    icon="search"
                    loading={this.props.isSearching}
                    onClick={this.props.handleSearch}
                  >
                    Search
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <Dialog
              title="Create New Market"
              visible={this.state.addMarketDialog}
              onCancel={() => this.setState({ addMarketDialog: false })}
              size="large"
              customClass="dialog"
            >
              <Dialog.Body>
                <Form labelPosition="top">
                  <Form.Item label="Add Market Name">
                    <Input
                      placeholder="Market Name"
                      value={marketName}
                      trim={true}
                      onChange={marketName => this.setState({ marketName })}
                    />
                  </Form.Item>
                  <Form.Item label="Add Tags">
                    <Select
                      multiple={true}
                      filterable={true}
                      placeholder="Market Tags"
                      onChange={selectedTags => this.setState({ selectedTags })}
                      remote={true}
                      remoteMethod={this.handleFilterTags}
                    >
                      {options.map(option => (
                        <Select.Option
                          key={option.value}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Select>
                  </Form.Item>
                </Form>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  onClick={() => this.setState({ addMarketDialog: false })}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  disabled={!marketName}
                  onClick={event => this.handleAddMarket(event, user)}
                >
                  Add
                </Button>
              </Dialog.Footer>
            </Dialog>
          </>
        )}
      </UserContext.Consumer>
    );
  }
}

export default NewMarket;
