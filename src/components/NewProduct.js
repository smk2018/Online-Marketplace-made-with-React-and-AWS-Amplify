import React from "react";
import { Auth, Storage, API, graphqlOperation } from "aws-amplify";
import { PhotoPicker } from "aws-amplify-react";
import { createProduct } from "../graphql/mutations";
import { convertDollarsToCents } from "../utils";
// prettier-ignore
import { Form, Button, Input, Notification, Radio, Progress } from "element-react";
import aws_exports from "../aws-exports";

const initialState = {
  description: "",
  image: "",
  imagePreview: "",
  price: "",
  shipped: true,
  isUploading: false,
  percentUploaded: 0
};

class NewProduct extends React.Component {
  state = { ...initialState };

  handleAddProduct = async event => {
    event.preventDefault();
    this.setState({ isUploading: true });
    const visibility = "public";
    const { identityId } = await Auth.currentCredentials();
    const filename = `/${visibility}/${identityId}/${Date.now()}-${
      this.state.image.name
    }`;
    const uploadedFile = await Storage.put(filename, this.state.image.file, {
      contentType: this.state.image.type,
      progressCallback: progress => {
        console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
        const percentUploaded = Math.round(
          (progress.loaded / progress.total) * 100
        );
        this.setState({ percentUploaded });
      }
    });
    const file = {
      key: uploadedFile.key,
      bucket: aws_exports.aws_user_files_s3_bucket,
      region: aws_exports.aws_project_region
    };
    const input = {
      price: convertDollarsToCents(this.state.price),
      description: this.state.description,
      shipped: this.state.shipped,
      productMarketId: this.props.marketId,
      file
    };
    const result = await API.graphql(
      graphqlOperation(createProduct, { input })
    );
    console.log("Uploaded file", result);
    Notification({
      title: "Success",
      message: "Product successfully created!",
      type: "success"
    });
    this.setState({ ...initialState });
  };

  render() {
    const {
      image,
      imagePreview,
      description,
      price,
      shipped,
      isUploading,
      percentUploaded
    } = this.state;

    return (
      <div className="flex-center">
        <h2 className="header">Add New Product</h2>
        <div>
          <Form onSubmit={this.handleAddProduct} className="market-header">
            <Form.Item label="Add Product Description">
              <Input
                type="text"
                icon="information"
                placeholder="Description"
                value={description}
                onChange={description => this.setState({ description })}
              />
            </Form.Item>
            <Form.Item label="Set Product Price">
              <Input
                type="number"
                icon="plus"
                placeholder="Price ($USD)"
                value={price}
                onChange={price => this.setState({ price })}
              />
            </Form.Item>
            <Form.Item label="Is the Product Shipped or Emailed to the Customer?">
              <div className="text-center">
                <Radio
                  value="true"
                  checked={shipped === true}
                  onChange={() => this.setState({ shipped: true })}
                >
                  Shipped
                </Radio>
                <Radio
                  value="false"
                  checked={shipped === false}
                  onChange={() => this.setState({ shipped: false })}
                >
                  Emailed
                </Radio>
              </div>
            </Form.Item>
            {imagePreview && (
              <img
                className="image-preview"
                src={imagePreview}
                alt="Product Preview"
              />
            )}
            {percentUploaded > 0 && (
              <Progress
                type="circle"
                className="progress"
                percentage={percentUploaded}
              />
            )}
            <PhotoPicker
              title="Product Image"
              preview="hidden"
              onLoad={url => this.setState({ imagePreview: url })}
              onPick={file => this.setState({ image: file })}
              theme={{
                formContainer: {
                  // brings the photo picker closer to the added button
                  margin: 0,
                  padding: "0.8em"
                },
                formSection: {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center"
                },
                sectionBody: {
                  margin: 0,
                  width: "250px"
                },
                sectionHeader: {
                  padding: "0.2em",
                  color: "var(--darkAmazonOrange)"
                },
                photoPickerButton: {
                  display: "none"
                }
              }}
            />
            <Form.Item>
              <Button
                onClick={this.handleAddProduct}
                disabled={!image || !description || !price || isUploading}
                loading={isUploading}
                type="primary"
              >
                {isUploading ? "Uploading..." : "Add Product"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  }
}

export default NewProduct;
