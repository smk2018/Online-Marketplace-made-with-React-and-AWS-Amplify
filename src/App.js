import React from "react";
import { Authenticator, AmplifyTheme } from "aws-amplify-react";
import { Auth, API, graphqlOperation, Hub } from "aws-amplify";
import { Router, Route } from "react-router-dom";
import createBrowserHistory from "history/createBrowserHistory";
import { getUser } from "./graphql/queries";
import { registerUser } from "./graphql/mutations";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import ProfilePage from "./pages/ProfilePage";
import "./App.css";

export const history = createBrowserHistory();

export const UserContext = React.createContext();

class App extends React.Component {
  state = {
    user: null,
    userAttributes: null
  };

  componentDidMount() {
    /* Log the AmplifyTheme in order to see all the stylable properties */
    // console.dir(AmplifyTheme);
    this.getUserData();
    Hub.listen("auth", this, "onHubCapsule");
  }

  onHubCapsule = capsule => {
    switch (capsule.payload.event) {
      case "signIn":
        console.log("signed in");
        this.getUserData();
        this.registerNewUser(capsule.payload.data);
        break;
      case "signUp":
        console.log("signed up");
        break;
      case "signOut":
        console.log("signed out");
        this.setState({ user: null });
        break;
      default:
        return;
    }
  };

  getUserData = async () => {
    const user = await Auth.currentAuthenticatedUser();
    user
      ? this.setState({ user }, () => this.getUserAttributes(this.state.user))
      : this.setState({ user: null });
  };

  getUserAttributes = async authUserData => {
    const userAttributes = await Auth.userAttributes(authUserData);
    const attributesObj = Auth.attributesToObject(userAttributes);
    this.setState({ userAttributes: attributesObj });
  };

  registerNewUser = async signInData => {
    const getUserInput = {
      id: signInData.signInUserSession.idToken.payload.sub
    };
    const { data } = await API.graphql(graphqlOperation(getUser, getUserInput));
    // if we can't get a user (meaning the user hasn't been registered before), then we call registerUser
    if (!data.getUser) {
      try {
        const registerUserInput = {
          ...getUserInput,
          username: signInData.username,
          email: signInData.signInUserSession.idToken.payload.email,
          registered: true
        };
        const newUser = await API.graphql(
          graphqlOperation(registerUser, { input: registerUserInput })
        );
        console.log({ newUser });
      } catch (err) {
        console.log("Error registering new user", err);
      }
    }
  };

  handleSignout = async () => {
    try {
      await Auth.signOut();
    } catch (err) {
      console.error("Error signing out user", err);
    }
  };

  render() {
    const { user, userAttributes } = this.state;

    return !user ? (
      <Authenticator theme={theme} />
    ) : (
      <UserContext.Provider value={{ user, userAttributes }}>
        <Router history={history}>
          <>
            {/* Navigation */}
            <Navbar user={user} handleSignout={this.handleSignout} />

            {/* Routing */}
            <div className="app-container">
              <Route exact path="/" component={HomePage} />
              <Route
                path="/profile"
                component={() => (
                  <ProfilePage user={user} userAttributes={userAttributes} />
                )}
              />
              <Route
                path="/markets/:marketId"
                component={({ match }) => (
                  <MarketPage
                    marketId={match.params.marketId}
                    user={user}
                    userAttributes={userAttributes}
                  />
                )}
              />
            </div>
          </>
        </Router>
      </UserContext.Provider>
    );
  }
}

const theme = {
  /* Note: Best way to change background is by setting an html rule in App.css */
  ...AmplifyTheme,
  /* Remove Navbar styling when switching from withAuthenticator to Authenticator (since Authenticator has no Navbar) */
  // navBar: {
  //   ...AmplifyTheme.navBar,
  //   backgroundColor: "#FFC0CB"
  // },
  button: {
    ...AmplifyTheme.button,
    backgroundColor: "var(--amazonOrange)"
  },
  // can change the color of the sectionBody, but not of sectionForm currently (may change in the future)
  sectionBody: {
    ...AmplifyTheme.sectionBody,
    padding: "5px"
  },
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "var(--squidInk)"
  }
};

export default App;
// export default withAuthenticator(App, true, [], null, myTheme);

// O4827014@nwytg.net
// Erc89021@ebbob.com
