import StartPageInfo from "../../components/StartPageInfo/StartPageInfo";
import StartPageHeader from "../../components/StartPageHeader/StartPageHeader";
import StartPageFooter from "../../components/StartPageFooter/StartPageFooter";

import "./style.scss";

const MainPageComponent = () => {
  return (
    <>
      <div className="main-page">
        <StartPageHeader />
        <main>
          <StartPageInfo />
        </main>
        <StartPageFooter />
      </div>
    </>
  );
};

export default MainPageComponent;
