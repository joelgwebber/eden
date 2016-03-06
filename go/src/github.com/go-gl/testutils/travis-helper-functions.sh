#! /usr/bin/env bash

read -r -d '' CODE_HEADER <<H
// Copyright \d{4} The go-gl Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

H

wget -q https://raw.github.com/go-gl/testutils/master/imgurbash.sh
chmod u+x imgurbash.sh

# Error log
erl() {
  at "  ""$@"
  "$@" &>> error.log
  return $?
}

at() {
  echo "--" "$@" | tee -a error.log
  date +%H:%M:%S.%N &>> error.log
}

check-formatting() {
  BADFMT="$(find . -iname \*.go | xargs gofmt -l)"
  if [[ -n "$BADFMT" ]]
  then
    at "go fmt found problems with the following files:"
    echo "$BADFMT"
    return 1
  fi

  if [[ -n "$(go vet)" ]]
  then
    at "go vet found problems"
    return 1
  fi

  if [[ -n "$(go fix)" ]]
  then
    at "go fix found problems"
    return 1
  fi

  FILES_MISSING_HEADERS=false

  for f in $(find . -iname "*.go")
  do
    if ! pcregrep -qM "$CODE_HEADER" "$f"
    then
      at " '$f' is missing license header:"
      FILES_MISSING_HEADERS=true
    fi
  done

  if $FILES_MISSING_HEADERS
  then
    echo "Some files are missing license headers, which should look like this,"\
         " followed by an empty line:"
    echo "$CODE_HEADER"
    return 1
  fi
}

# $1 == name of this package
# $2 == name of package to checkout and test
# For example, if the package being tested is pwaller's clone of go-gl/gl,
# and we wish to ensure go-gl/examples still works, then the current package
# needs to be copied from pwaller/gl to go-gl/gl and installed.
subtest-init() {
  WHOAMI="$1"
  PROPER_LOCATION="${GOPATH}/src/github.com/${WHOAMI}"
  TESTPKG="github.com/${2}"
  if [[ "$PWD" != "${PROPER_LOCATION}" ]]; then
    at "Moving myself to ${PROPER_LOCATION}..."
    mkdir -p "${PROPER_LOCATION}"
    cp -R "${PWD}"/* "${PROPER_LOCATION}"
    pushd "${PROPER_LOCATION}"
    at "go get"
    erl go get -d -v
    at "go build"
    erl go build
    at "go install"
    erl go install
    popd
  fi
  
  at "Fetching ${TESTPKG}"
  go get -d -v "${TESTPKG}"
  at "Installing test deps for ${TESTPKG}"
  go test -i "${TESTPKG}"
}

subtest() {
  TESTPKG="github.com/${2}"
  at "Testing ${TESTPKG}"
  go test -v "${TESTPKG}"
}

failure() {
  at "Failure - error log contents:"
  cat error.log
  upload-to-imgur
  exit 1
}

upload-to-imgur() {
  at "Uploading to imgur"
  for file in *.png
  do
    at "Uploading $file"
    ./imgurbash.sh $file
    echo
  done
}

die() {
  at "Failure: $@"
  exit 1
}

initialize() {
  at "Installing eatmydata and pcregrep"
  erl sudo apt-get install eatmydata pcregrep || die "Failed to install"

  at "Checking code formatting"
  check-formatting \
    || die "Formatting checks failed"

  at "apt-get update -qq"
  erl sudo eatmydata apt-get update -qq \
    || die "'apt-get update -qq' failed"

  at "Installing packages"
  # eatmydata provides a slight speedup for installing many packages. At one time
  # it was significant (when installing the whole of lightdm for example), but
  # I'm not sure if it's the case here. It doesn't cost anything, so here it is.
  erl sudo eatmydata apt-get install -qq \
    libglfw-dev libglew-dev mesa-utils inotify-tools xserver-xorg \
    libsdl1.2-dev libsdl-image1.2-dev \
      || die "Failed to install dependencies"

  at "Starting X"
  erl sudo mkdir -p /tmp/.X11-unix
  (sleep 0.5 && sudo X) &>> error.log &

  at "Waiting for X to come up"
  erl inotifywait -t 4 -r /tmp/.X11-unix

  export DISPLAY=:0

  at "Running glxgears test"
  (glxgears -info &) && sleep 2 && pkill glxgears

  at "Fetching package dependencies"
  go get -d -v \
    || die "go get failed"

  at "Fetching test dependencies"
  go list -f '{{range .TestImports}}{{.}} {{end}}' | xargs go get -d -v \
    || die "Fetching test deps failed"

  at "Installing test dependencies"
  go test -i \
    || die "'go test -i' failed"
}
