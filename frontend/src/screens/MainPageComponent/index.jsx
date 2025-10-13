import StartPageInfo from "../../components/StartPageInfo/StartPageInfo";
import MainPageHeaderComponent from "./MainPageHeaderComponent";
import FooterComponent from "./FooterComponent";

import "./style.scss";

const MainPageComponent = () => {
  return (
    <>
      <div className="main-page">
        <MainPageHeaderComponent />
        <main>
          <StartPageInfo />
        </main>
        <FooterComponent />
      </div>
    </>
  );
};

export default MainPageComponent;
