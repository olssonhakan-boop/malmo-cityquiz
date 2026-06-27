/**
 * Patches that must survive npm install.
 *
 * Patch 1 — ReactNative-application.cmake
 *   NDK 27 removed the gold linker; check_ipo_supported() calls it and crashes cmake.
 *   Fix: skip the IPO check entirely.
 *
 * Patch 2 — Geolocation codegen stub
 *   @react-native-community/geolocation only runs codegen with newArchEnabled=true.
 *   When newArchEnabled=false the JNI directory never gets created, but the
 *   autolinking cmake still references it. Fix: create a minimal stub.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── Patch 1: IPO/gold linker fix ─────────────────────────────────────────────

const CMAKE_FILE = path.join(
  ROOT,
  'node_modules/react-native/ReactAndroid/cmake-utils/ReactNative-application.cmake',
);

const IPO_ORIGINAL = `# If the user toolchain supports IPO, we enable it for the app build
include(CheckIPOSupported)
check_ipo_supported(RESULT IPO_SUPPORT)
if (IPO_SUPPORT)
  set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
endif()`;

const IPO_PATCHED = `# IPO/LTO check disabled — gold linker not supported in NDK 27
set(IPO_SUPPORT FALSE)`;

if (fs.existsSync(CMAKE_FILE)) {
  let src = fs.readFileSync(CMAKE_FILE, 'utf8');
  if (src.includes('check_ipo_supported')) {
    src = src.replace(IPO_ORIGINAL, IPO_PATCHED);
    fs.writeFileSync(CMAKE_FILE, src);
    console.log('[patch] ReactNative-application.cmake — IPO check disabled');
  } else {
    console.log('[patch] ReactNative-application.cmake — already patched, skipping');
  }
} else {
  console.warn('[patch] WARNING: ReactNative-application.cmake not found');
}

// ── Patch 2: Geolocation codegen stub ────────────────────────────────────────

const GEO_JNI_DIR = path.join(
  ROOT,
  'node_modules/@react-native-community/geolocation/android/build/generated/source/codegen/jni',
);

const GEO_CMAKE = `cmake_minimum_required(VERSION 3.13)
# Stub for old-arch mode — geolocation codegen not generated when newArchEnabled=false

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

add_library(react_codegen_RNCGeolocationSpec STATIC stub.cpp)
target_include_directories(react_codegen_RNCGeolocationSpec PUBLIC .)

target_link_libraries(
  react_codegen_RNCGeolocationSpec
  fbjni::fbjni
  ReactAndroid::jsi
  ReactAndroid::reactnative
)

target_compile_reactnative_options(react_codegen_RNCGeolocationSpec PRIVATE)
`;

const GEO_HEADER = `#pragma once

#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>

namespace facebook::react {

JSI_EXPORT
std::shared_ptr<TurboModule> RNCGeolocationSpec_ModuleProvider(
    const std::string &moduleName,
    const JavaTurboModule::InitParams &params);

} // namespace facebook::react
`;

const GEO_STUB_CPP = `#include "RNCGeolocationSpec.h"

namespace facebook::react {

std::shared_ptr<TurboModule> RNCGeolocationSpec_ModuleProvider(
    const std::string & /*moduleName*/,
    const JavaTurboModule::InitParams & /*params*/) {
  return nullptr;
}

} // namespace facebook::react
`;

if (!fs.existsSync(GEO_JNI_DIR)) {
  fs.mkdirSync(GEO_JNI_DIR, {recursive: true});
}

const cmakePath = path.join(GEO_JNI_DIR, 'CMakeLists.txt');
const headerPath = path.join(GEO_JNI_DIR, 'RNCGeolocationSpec.h');
const stubPath   = path.join(GEO_JNI_DIR, 'stub.cpp');

if (!fs.existsSync(cmakePath)) {
  fs.writeFileSync(cmakePath,  GEO_CMAKE);
  fs.writeFileSync(headerPath, GEO_HEADER);
  fs.writeFileSync(stubPath,   GEO_STUB_CPP);
  console.log('[patch] Geolocation codegen stub created');
} else {
  console.log('[patch] Geolocation stub already exists, skipping');
}

console.log('[patch] All patches applied.');
