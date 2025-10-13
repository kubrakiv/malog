import React, { useState, useContext, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaAngleRight } from "react-icons/fa";
import "./SidebarItem.scss";
import OpenContext from "../../OpenContext";
import cn from "classnames";
import { SidebarFloatingMenu } from "../SidebarFloatingMenu/SidebarFloatingMenu";
import { SidebarAccordionMenu } from "../SidebarAccordionMenu/SidebarAccordionMenu";

export default function SidebarItem({ item }) {
    const [open, setOpen] = useState(false);
    const [isHovered, setHovered] = useState(false);
    const { isSidebarOpen } = useContext(OpenContext);
    const location = useLocation();

    // This useEffect closes accordion when sidebar is closed
    useEffect(() => {
        if (!isSidebarOpen) {
            setOpen(false);
        }
    }, [isSidebarOpen]);

    const handleMouseEnter = () => {
        setHovered(true);
    };

    const handleMouseLeave = () => {
        setHovered(false);
    };

    const hasOpenChild = (children) => {
        if (!children) {
            return false;
        }

        for (const child of children) {
            if (
                child.path === location.pathname ||
                hasOpenChild(child.childrens)
            ) {
                return true;
            }
        }

        return false;
    };

    const linkContent = (
        <span className="link">
            {item.icon && <i className="link-icon">{item.icon}</i>}
            {isSidebarOpen && <span className="link-title">{item.title}</span>}
        </span>
    );

    return (
        <>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={cn("sidebar-item", {
                    open: isSidebarOpen && open,
                    active:
                        location.pathname === item.path ||
                        hasOpenChild(item.childrens),
                })}
            >
                {item?.childrens?.length ? (
                    <div
                        className="sidebar-title"
                        onClick={() => isSidebarOpen && setOpen(!open)}
                    >
                        {linkContent}
                        {isSidebarOpen && item.childrens && (
                            <i className="toggle-btn">
                                <FaAngleRight />
                            </i>
                        )}
                    </div>
                ) : (
                    <NavLink
                        to={item.path}
                        className="sidebar-title"
                        onClick={() => isSidebarOpen && setOpen(!open)}
                    >
                        {linkContent}
                    </NavLink>
                )}

                {item && (
                    <div
                        className={cn("sidebar-content", {
                            "sidebar-content--open":
                                isHovered && !isSidebarOpen,
                        })}
                    >
                        {isSidebarOpen && (
                            <SidebarAccordionMenu items={item.childrens} />
                        )}
                        {!isSidebarOpen && (
                            <SidebarFloatingMenu
                                title={item.title}
                                items={item.childrens}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
