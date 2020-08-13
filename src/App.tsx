import React from 'react';
import logo from './logo.svg';
import './App.css';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import {Box} from "@material-ui/core";

function App() {
	return (
		<Box>
			<div className="App">
				<header className="App-header">
					<Button variant="contained" startIcon={<DeleteIcon />}>Default</Button>
					<img src={logo} className="App-logo" alt="logo" />
					<p>
						Edit <code>src/App.tsx</code> and save to reload.
					</p>
					<a
						className="App-link"
						href="https://reactjs.org"
						target="_blank"
						rel="noopener noreferrer">
						Learn React
					</a>
				</header>
			</div>
		</Box>
	);
}

export default App;