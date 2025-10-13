import { NavLink } from "react-router-dom";

import "./SidebarFloatingMenu.scss";

export const SidebarFloatingMenu = ({ title, items }) => {
  return (
    <ul className="floating-menu">
      <div className="floating-menu__title">{title}</div>
      {items &&
        items.map((item, index) => (
          <li key={index} className="floating-menu__list-item">
            <NavLink to={item.path} className="floating-menu__link">
              {item.title}
            </NavLink>
          </li>
        ))}
    </ul>
  );
};
