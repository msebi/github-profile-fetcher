// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

document.addEventListener('DOMContentLoaded', function () {
	
	chrome.tabs.create({active: true, url: "./options_git_profile_fetcher.html"});
});