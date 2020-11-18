import React from "react";
import { API, graphqlOperation } from "aws-amplify";
import { searchMarkets } from "../graphql/queries";
import MarketList from "../components/MarketList";
import NewMarket from "../components/NewMarket";

// Make home a stateful component in order to add search
class HomePage extends React.Component {
  state = {
    searchTerm: "",
    searchResults: [],
    isSearching: false
  };

  handleSearchChange = searchTerm => this.setState({ searchTerm });

  handleClearSearch = () => {
    this.setState({ searchTerm: "", searchResults: [] });
  };

  handleSearch = async event => {
    event.preventDefault();
    this.setState({ isSearching: true });
    const result = await API.graphql(
      graphqlOperation(searchMarkets, {
        filter: {
          or: [
            { name: { match: this.state.searchTerm } },
            //   regexp: `.*${this.state.searchTerm}.*`
            { owner: { match: this.state.searchTerm } },
            { tags: { match: this.state.searchTerm } }
          ]
        },
        sort: {
          field: "createdAt",
          direction: "desc"
        }
      })
    );
    this.setState({
      searchResults: result.data.searchMarkets.items,
      isSearching: false
    });
  };

  render() {
    return (
      <>
        <NewMarket
          handleSearchChange={this.handleSearchChange}
          handleSearch={this.handleSearch}
          handleClearSearch={this.handleClearSearch}
          searchTerm={this.state.searchTerm}
          isSearching={this.state.isSearching}
        />
        <MarketList searchResults={this.state.searchResults} />
      </>
    );
  }
}

export default HomePage;
