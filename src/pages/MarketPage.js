import React from "react";
import { Loading, Tabs, Icon } from "element-react";
import { API, graphqlOperation } from "aws-amplify";
// prettier-ignore
import { onCreateProduct, onUpdateProduct, onDeleteProduct } from "../graphql/subscriptions";
import { Link } from "react-router-dom";
import NewProduct from "../components/NewProduct";
import Product from "../components/Product";
import { formatProductDate } from "../utils";

// NOTE! 'products' modified to add sort direction / limit,
// 'file' object also added within products.items
// 'shipped' also added within products.items
const getMarket = `query GetMarket($id: ID!) {
  getMarket(id: $id) {
    id
    name
    products(sortDirection: DESC, limit: 999) {
      items {
        id
        description
        shipped
        file {
          key 
          bucket
          region
        }
        price
        owner
        createdAt
      }
      nextToken
    }
    owner
    createdAt
  }
}
`;

class MarketPage extends React.Component {
  state = {
    market: null,
    isLoading: true,
    isMarketOwner: false,
    isEmailVerified: false
  };

  componentDidMount() {
    this.handleGetMarket();
    this.deleteProductListener = API.graphql(
      graphqlOperation(onDeleteProduct)
    ).subscribe({
      next: productData => {
        const deletedProduct = productData.value.data.onDeleteProduct;
        const updatedItems = this.state.market.products.items.filter(
          item => item.id !== deletedProduct.id
        );
        const market = { ...this.state.market };
        market.products.items = updatedItems;
        this.setState({ market });
      }
    });
    this.createProductListener = API.graphql(
      graphqlOperation(onCreateProduct)
    ).subscribe({
      next: productData => {
        const createdProduct = productData.value.data.onCreateProduct;
        const prevProducts = this.state.market.products.items.filter(
          item => item.id !== createdProduct.id
        );
        const updatedItems = [createdProduct, ...prevProducts];
        const market = { ...this.state.market };
        market.products.items = updatedItems;
        this.setState({ market });
      }
    });
    this.updateProductListener = API.graphql(
      graphqlOperation(onUpdateProduct)
    ).subscribe({
      next: productData => {
        const updatedProduct = productData.value.data.onUpdateProduct;
        const updatedProductIndex = this.state.market.products.items.findIndex(
          item => item.id === updatedProduct.id
        );
        const updatedItems = [
          ...this.state.market.products.items.slice(0, updatedProductIndex),
          updatedProduct,
          ...this.state.market.products.items.slice(updatedProductIndex + 1)
        ];
        const market = { ...this.state.market };
        market.products.items = updatedItems;
        this.setState({ market });
      }
    });
  }

  componentWillUnmount() {
    this.deleteProductListener.unsubscribe();
    this.createProductListener.unsubscribe();
    this.updateProductListener.unsubscribe();
  }

  handleGetMarket = async () => {
    const result = await API.graphql(
      graphqlOperation(getMarket, { id: this.props.marketId })
    );
    this.setState({ market: result.data.getMarket, isLoading: false }, () => {
      this.checkMarketOwner();
      this.checkEmailVerified();
    });
  };

  checkMarketOwner = () => {
    const { user } = this.props;
    const { market } = this.state;
    if (user) {
      this.setState({ isMarketOwner: user.username === market.owner });
    }
  };

  checkEmailVerified = () => {
    const { userAttributes } = this.props;
    if (userAttributes) {
      this.setState({ isEmailVerified: userAttributes.email_verified });
    }
  };

  render() {
    const { market, isLoading, isMarketOwner, isEmailVerified } = this.state;

    return isLoading ? (
      <Loading fullscreen={true} />
    ) : (
      <>
        {/* Back Button */}
        <Link className="link" to="/">
          Back to Markets List
        </Link>

        {/* Market MetaData */}
        <span className="items-center pt-2">
          <h2 className="mb-mr">{market.name}</h2>• {market.owner}
        </span>
        <div className="items-center pt-2">
          <span style={{ color: "var(--lightSquidInk)", paddingBottom: "1em" }}>
            <Icon name="date" className="icon" />
            {formatProductDate(market.createdAt)}
          </span>
        </div>

        {/* New Product */}
        <Tabs type="border-card" value={isMarketOwner ? "1" : "2"}>
          {isMarketOwner && (
            <Tabs.Pane
              label={
                <>
                  <Icon name="plus" className="icon" />
                  Add Product
                </>
              }
              name="1"
            >
              {isEmailVerified ? (
                <NewProduct marketId={market.id} />
              ) : (
                <Link className="header" to="/profile">
                  Verify Your Email Before Adding Products
                </Link>
              )}
            </Tabs.Pane>
          )}
          <Tabs.Pane
            label={
              <>
                <Icon name="menu" className="icon" />
                Products ({market.products.items.length})
              </>
            }
            name="2"
          >
            {/* Product List */}
            <div className="product-list">
              {market.products.items.map(product => (
                <Product key={product.file.key} product={product} />
              ))}
            </div>
          </Tabs.Pane>
        </Tabs>
      </>
    );
  }
}

export default MarketPage;
