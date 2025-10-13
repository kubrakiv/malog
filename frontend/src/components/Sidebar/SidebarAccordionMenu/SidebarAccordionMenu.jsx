import { NavLink } from "react-router-dom";

import "./SidebarAccordionMenu.scss";

export const SidebarAccordionMenu = ({ items }) => {
  return (
    <ul className="accordion-menu">
      {items &&
        items.map((item, index) => (
          <li key={index} className="accordion-menu__list-item">
            <NavLink to={item.path} className="accordion-menu__link">
              {item.title}
            </NavLink>
          </li>
        ))}
    </ul>
  );
};
