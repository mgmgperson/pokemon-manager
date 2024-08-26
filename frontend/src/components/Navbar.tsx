import React from 'react';
import './css/Navbar.scss';

const Navbar: React.FC = () => {
    return (
        <nav className="navbar navbar-expand-sm navbar-light navbar-border flex-nowrap fixed-top">
            <a className="navbar-brand ms-3 me-5 fw-bold text-white" href="/">Pokemon Manager</a>

            <form className="d-flex">
                <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" style={{width: '650px'}}/>
            </form>

            <button className="btn btn-success ms-2" type="submit">Save</button>

            <div className="dropdown ms-2">
                <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                    Calendar
                </button>
            </div>

            <button className="btn btn-primary ms-2" type="button">Next</button>
        </nav>
    );
};

export default Navbar;