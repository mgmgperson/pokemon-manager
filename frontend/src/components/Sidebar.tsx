import React from 'react';
import { NavLink } from 'react-router-dom';
import './css/Sidebar.scss';

const SideBar: React.FC = () => {
    return (
        <nav className="sidebar flex-shrink-0 sidebar-open border-end" id="sidebar" aria-label="side navigation">
             <div className="sidebar-inner small-scrollbar">
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/">
                            Home
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/">
                            Inbox
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/">
                            Squad
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/">
                            Training
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/">
                            Finances
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/trainers">
                            PWTR
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/dex">
                            Pokedex
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/regions">
                            Regions
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/league">
                            League
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/">
                            PPL
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/">
                            Tournaments
                        </NavLink>
                    </li>
                </ul>
                <ul className="nav flex-column flex-nowrap overflow-hidden">
                    <li className="sidenav-item">
                        <NavLink className="sidenav-link" to="/">
                            History
                        </NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default SideBar;
