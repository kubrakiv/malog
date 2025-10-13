import React from "react";
import MainPageHeaderComponent from "../MainPageComponent/MainPageHeaderComponent";
import FooterComponent from "../MainPageComponent/FooterComponent";
import SubscriptionPlansPage from "./SubscriptionPlansPage";

import "../MainPageComponent/style.scss";

const SubscriptionPlansPageWithLayout = () => {
  return (
    <>
      <div className="main-page">
        <MainPageHeaderComponent />
        <main>
          <SubscriptionPlansPage />
        </main>
        <FooterComponent />
      </div>
    </>
  );
};

export default SubscriptionPlansPageWithLayout;
