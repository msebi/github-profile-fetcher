
   $(document).ready(function() {
	$('#githubForm').bootstrapValidator({
		// To use feedback icons, ensure that you use Bootstrap v3.1.0 or later
		feedbackIcons: {
			valid: 'glyphicon glyphicon-ok',
			invalid: 'glyphicon glyphicon-remove',
			validating: 'glyphicon glyphicon-refresh'
		},
		fields: {
			userName: {
				validators: {
						stringLength: {
						min: 1,
					},
						notEmpty: {
						message: 'Enter a github user name'
					}
				}
			},
		}
	})
   });
	
   var PROFILE_TABLE_ENTRY = 'profileTableEntry';
   var PROFILE_NAME = 'name';
   var PROFILE_EMAIL = 'email';
   var REPOS_TABLE_ENTRY = 'reposTableEntry';
   
   function initTables() {		
		$('#githubProfileLegend').empty();
		$('#githubProfileLegend').append('Profile Info');
		$('#githubProfileTable').empty();
		$('#githubProfileTable').append('<thead class=\\"thead-dark\\"><tr><th scope=\\"col\\">id</th><th scope=\\"col\\">login</th><th scope=\\"col\\">display_login</th><th scope=\\"col\\">gravatar_id</th><th scope=\\"col\\">url</th><th scope=\\"col\\">avatar_url</th><th scope=\\"col\\">email</th><th scope=\\"col\\">name</th></tr></thead><tbody><tr>');
		$('#githubReposLegend').empty();
		$('#githubReposLegend').append('Repos Info');
		$('#githubReposTable').empty();
		$('#githubReposTable').append('<thead class=\\"thead-dark\\"><tr><th scope=\\"col\\">HTML URL</th><th scope=\\"col\\">Description</th><th scope=\\"col\\">Clone</th><th scope=\\"col\\">SVN</th><th scope=\\"col\\">Homepage</th><th scope=\\"col\\">Contributors</th></tr></thead><tbody><tr>');
   }
   
   function finalizeTables() {
		$('#githubProfileTable').append('</tr></tbody>');
   }

   function makeRequest(url) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		xhr.send();
		return xhr.responseText;
   }
   
   function downloadJSON(content, fileName, contentType) {
		content = JSON.stringify(content);
		var a = document.createElement("a");
		var file = new Blob([content], {type: contentType});
		a.href = URL.createObjectURL(file);
		a.download = fileName;
		a.click();
   }
   
   function downloadJSONFromURL(url, fileName, contentType) {
		content = JSON.stringify(makeRequest(url));
		var a = document.createElement("a");
		var file = new Blob([content], {type: contentType});
		a.href = URL.createObjectURL(file);
		a.download = fileName;
		a.click();
   }

   function checkNestedObject(obj, args) {
	
		if(args.length === 0) {
			return true;
		}
		
		for(var key in obj) {
			if(obj.hasOwnProperty(key)) {
				if(key === args[0]) {
					return checkNestedObject(obj[key], args.slice(1, args.length));
				}
			}
		}
		
		return false;
   } 
   
   function checkNestedObjectFlat(obj, args) {
		
		for(var i = 0; i < args.length; i++) {
			
			if(!obj.hasOwnProperty(args[i])) {
				return false;
			}
		}
		
		return true;
   }
   
   function generateRepoLink(url) {
		var repoName = url.substr(url.lastIndexOf('/') + 1);
		var repo = ['<td>', '<a target="_blank" rel="noopener noreferrer" href="', url, '">', repoName, '</a>', '</td>'];
		return repo.join('');
   }
   
   function generateContributorLink(userName) {
		var url = ['https://github.com/', userName];
		var res = ['<a target="_blank" rel="noopener noreferrer" href="', url.join(''), '">', userName, '</a>'];
		return res.join('');
   }
   
   function getUserProfile(userName) {
		var url = "https://api.github.com/users/"

		url = url + userName;
		url = url + "/events/public";

		var result = makeRequest(url);
		var resultJSON = JSON.parse(result);
		var found = 0;
		var firstEntry;
		var profileResult;
		var profileResultMap = {};
		
		for(var key in resultJSON) {
			if(resultJSON.hasOwnProperty(key)) {
				firstEntry = resultJSON[key];
				break;
			}
		}
		
		for(var key in firstEntry) {
			if(firstEntry.hasOwnProperty(key) && key.localeCompare('actor') == 0) {
				firstEntry = firstEntry[key];
				break;
			}
		}

		var tmp = "";
		for (var key in firstEntry) {
			if (firstEntry.hasOwnProperty(key)) {
				tmp = tmp + "<td>";
				tmp = tmp + firstEntry[key];
				tmp = tmp + "</td>";
			}
		}
		profileResult = tmp;
		
		for(var i = 0; i < resultJSON.length && found == 0; i++) {	
			// downloadJSON(resultJSON[i], 'userProfile.txt', 'text/plain');
			if(checkNestedObject(resultJSON[i], ['payload', 'commits', '0', 'author'])) {
				for(var j = 0; j < resultJSON[i].payload.commits.length; j++) {
					if(checkNestedObject(resultJSON[i].payload.commits[j], ['author', 'name']) && checkNestedObject(resultJSON[i].payload.commits[j], ['author', 'email'])) {
						var author = resultJSON[i].payload.commits[j].author;
						// if(author.name.localeCompare(userName) == 0) {
							tmp = "<td>";
							tmp = tmp + author.email;
							tmp = tmp + "</td>";
							profileResult = profileResult + tmp;
							profileResultMap[PROFILE_EMAIL] = author.email;
							tmp = "<td>";
							tmp = tmp + author.name;
							tmp = tmp + "</td>";
							profileResult = profileResult + tmp;
							profileResultMap[PROFILE_NAME] = author.name;
							found = 1;
							break;
						// }
					}
				}
			}
		}
		
		profileResultMap[PROFILE_TABLE_ENTRY] = profileResult;
		return profileResultMap;
   }
   
   function getContributors(contributorsUrl) {
		var result = makeRequest(contributorsUrl);
		var resultJSON = JSON.parse(result);
		var contributors = "";
		
		for(var i = 0; i < resultJSON.length; i++) {
			if(resultJSON[i].hasOwnProperty('login')) {
				var contributorProfile = getUserProfile(resultJSON[i].login);
				if(i % 2 == 0 && i != 0) {
					contributors = contributors + "</br>";
				}
				if(contributorProfile[PROFILE_NAME] == null || contributorProfile[PROFILE_EMAIL] == null) {
					contributors = contributors + generateContributorLink(resultJSON[i].login);
					if(i == resultJSON.length - 1) {
						contributors = contributors + " ()";
					} else {
						contributors = contributors + " (), ";
					}
					continue;
				}		
				contributors = contributors + generateContributorLink(resultJSON[i].login);
				contributors = contributors + " (";
				contributors = contributors + contributorProfile[PROFILE_EMAIL];
				if(i == resultJSON.length - 1) {
					contributors = contributors + ")";
				} else { 
					contributors = contributors + "), ";
				}
			}
		}
		
		return contributors;
   }
   
   function getRepos(userName) {
		var url = "https://api.github.com/users/"

		url = url + userName;
		url = url + "/repos";
		
		var result = makeRequest(url);
		var resultJSON = JSON.parse(result);
		var repoResult = "";
		var repoResultMap = {};
		
		for(var key in resultJSON) {
			if(resultJSON.hasOwnProperty(key)) {
				if(checkNestedObjectFlat(resultJSON[key], ['html_url', 'description', 'clone_url', 'svn_url', 'homepage', 'svn_url', 'contributors_url'])) {
					var tmp = "<tr>";
					tmp = tmp + generateRepoLink(resultJSON[key].html_url);
					tmp = tmp + "<td>";
					if(resultJSON[key].description == null) {
						tmp = tmp + "N/A";
					} else {
						tmp = tmp + resultJSON[key].description;
					}
					tmp = tmp + "</td>";
					tmp = tmp + generateRepoLink(resultJSON[key].clone_url);
					tmp = tmp + generateRepoLink(resultJSON[key].svn_url);
					tmp = tmp + "<td>";
					if(resultJSON[key].homepage == null) {
						tmp = tmp + "N/A";
					} else {
						tmp = tmp + resultJSON[key].homepage;
					}
					tmp = tmp + "</td>";
					tmp = tmp + "<td>";
					tmp = tmp + getContributors(resultJSON[key].contributors_url);
					tmp = tmp + "</td>";
					tmp = tmp + "</tr>";
					repoResult = repoResult + tmp;
				}
			}
		}
		
		repoResultMap[REPOS_TABLE_ENTRY] = repoResult;
		return repoResultMap;
   }
      
   function getProfile() {
		var userName = document.getElementById('githubUsername').value;
		var profileResultMap = getUserProfile(userName); 
		var repoResultMap = getRepos(userName);
		
		initTables();
		
		$('#githubProfileTable').append(profileResultMap[PROFILE_TABLE_ENTRY]);
		$('#githubReposTable').append(repoResultMap[REPOS_TABLE_ENTRY]);

		finalizeTables();
		
		// stop form refresh 
		$("#githubForm").submit(function(e) {
			e.preventDefault();
		});
   }
   
      document.addEventListener('DOMContentLoaded', function() {
		var button = document.getElementById('githubFormButton');
		button.addEventListener('click', function() {
			getProfile();
			return false;
		});
	});
   
