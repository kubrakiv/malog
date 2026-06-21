import React, { useState, useContext, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FaAngleRight } from "react-icons/fa";
import "./SidebarItem.scss";
import OpenContext from "../../OpenContext";
import cn from "classnames";
import { SidebarFloatingMenu } from "../SidebarFloatingMenu/SidebarFloatingMenu";
import { SidebarAccordionMenu } from "../SidebarAccordionMenu/SidebarAccordionMenu";

export default function SidebarItem({ item }) {
    const [open, setOpen] = useState(false);
    const [showFloatingMenu, setShowFloatingMenu] = useState(false);
    const [menuTop, setMenuTop] = useState(0);
    const { isSidebarOpen } = useContext(OpenContext);
    const location = useLocation();
    const itemRef = useRef(null);
    const hideTimer = useRef(null);

    useEffect(() => {
        if (!isSidebarOpen) {
            setOpen(false);
        } else {
            setShowFloatingMenu(false);
        }
    }, [isSidebarOpen]);

    useEffect(() => {
        return () => clearTimeout(hideTimer.current);
    }, []);

    const hasOpenChild = (children) => {
        if (!children) return false;
        for (const child of children) {
            if (child.path === location.pathname || hasOpenChild(child.childrens)) {
                return true;
            }
        }
        return false;
    };

    const handleItemEnter = () => {
        if (isSidebarOpen) return;
        clearTimeout(hideTimer.current);
        if (itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect();
            setMenuTop(rect.top);
        }
        setShowFloatingMenu(true);
    };

    const handleItemLeave = () => {
        hideTimer.current = setTimeout(() => setShowFloatingMenu(false), 15);
    };

    const handleMenuEnter = () => {
        clearTimeout(hideTimer.current);
    };

    const handleMenuLeave = () => {
        setShowFloatingMenu(false);
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
                ref={itemRef}
                onMouseEnter={handleItemEnter}
                onMouseLeave={handleItemLeave}
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
                            "sidebar-content--open": showFloatingMenu,
                        })}
                        style={showFloatingMenu ? { top: `${menuTop}px` } : undefined}
                        onMouseEnter={handleMenuEnter}
                        onMouseLeave={handleMenuLeave}
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
