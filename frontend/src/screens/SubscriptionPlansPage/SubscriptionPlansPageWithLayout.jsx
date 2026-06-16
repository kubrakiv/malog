import StartPageHeader from "../../components/StartPageHeader/StartPageHeader";
import StartPageFooter from "../../components/StartPageFooter/StartPageFooter";
import SubscriptionPlansPage from "./SubscriptionPlansPage";

import "../MainPageComponent/style.scss";

const SubscriptionPlansPageWithLayout = () => {
  return (
    <div className="main-page">
      <StartPageHeader />
      <main>
        <SubscriptionPlansPage />
      </main>
      <StartPageFooter />
    </div>
  );
};

export default SubscriptionPlansPageWithLayout;
