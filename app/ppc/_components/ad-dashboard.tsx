// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { AdForm } from "./ad-form";
import { AdList } from "./ad-list";
import { AdPreview } from "./ad-preview";
import { DashboardHeader } from "./dashboard-header";
import { DashboardLayout } from "./dashboard-layout";
import { toast } from "@/hooks/use-toast";

export function AdDashboard() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [sidebarView, setSidebarView] = useState<string>("dashboard");

  // Function to save ads to localStorage
  const saveAdsToLocalStorage = (ads) => {
    localStorage.setItem("ads", JSON.stringify(ads));
  };

  // Function to retrieve ads from localStorage
  const getAdsFromLocalStorage = () => {
    const ads = localStorage.getItem("ads");
    return ads ? JSON.parse(ads) : [];
  };

  useEffect(() => {
    const handleClearSelectedAd = () => {
      setSelectedAd(null);
    };

    window.addEventListener("clearSelectedAd", handleClearSelectedAd);

    // Load ads from localStorage when the component mounts
    const savedAds = getAdsFromLocalStorage();
    if (savedAds.length > 0) {
      setAds(savedAds);
      setSelectedAd(savedAds[0]);
    }

    return () => {
      window.removeEventListener("clearSelectedAd", handleClearSelectedAd);
    };
  }, []);

  const handleAddAd = () => {
    const newAd = {
      id: Date.now().toString(),
      name: "New Ad",
      type: "search", // Default type
      headlines: [""],
      descriptions: [""],
      keywords: [],
      finalUrl: "",
      displayPath: "",
      sitelinks: [],
    };
    const updatedAds = [...ads, newAd];
    setAds(updatedAds);
    setSelectedAd(newAd);
    setSidebarView("ads");
    saveAdsToLocalStorage(updatedAds); // Save to localStorage

    toast.info({
      title: "Ad added",
      description: "New ad has been added successfully",
    });
  };

  const handleCloneAd = (ad) => {
    // Clone sitelinks with new IDs
    const clonedSitelinks = ad.sitelinks
      ? ad.sitelinks.map((sitelink) => ({
          ...sitelink,
          id: Date.now() + Math.random().toString(36).substring(2, 9),
        }))
      : [];

    const clonedAd = {
      ...ad,
      id: Date.now().toString(),
      name: `${ad.name} (Copy)`,
      sitelinks: clonedSitelinks,
    };
    const updatedAds = [...ads, clonedAd];
    setAds(updatedAds);
    setSelectedAd(clonedAd);
    setSidebarView("ads");
    saveAdsToLocalStorage(updatedAds); // Save to localStorage

    toast.info({
      title: "Ad cloned",
      description: `"${ad.name}" has been cloned successfully`,
    });
  };

  const handleSelectAd = (ad) => {
    setSelectedAd(ad);
    setSidebarView("ads");
  };

  const handleDeleteAd = (adId) => {
    try {
      console.log("Delete function called with ID:", adId);

      // Find the ad to be deleted
      const adToDelete = ads.find((ad) => ad.id === adId);

      if (!adToDelete) {
        console.error("Ad not found:", adId);
        return;
      }

      // Create a new array without the deleted ad
      const updatedAds = ads.filter((ad) => ad.id !== adId);

      console.log("Updated ads array:", updatedAds);

      // Update state with the new array
      setAds(updatedAds);
      saveAdsToLocalStorage(updatedAds); // Save to localStorage

      // If we're deleting the currently selected ad, update selectedAd
      if (selectedAd?.id === adId) {
        if (updatedAds.length > 0) {
          setSelectedAd(updatedAds[0]);
        } else {
          setSelectedAd(null);
        }
      }

      console.log("Saving Ad");

      // Show success toast
      toast({
        title: "Ad deleted",
        description: adToDelete
          ? `"${adToDelete.name}" has been deleted`
          : "Ad has been deleted",
        variant: "success",
      });

      console.log("Delete operation completed");
    } catch (error) {
      console.error("Error deleting ad:", error);

      toast({
        title: "Error",
        description: "Failed to delete ad. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAd = (updatedAd) => {
    const updatedAds = ads.map((ad) =>
      ad.id === updatedAd.id ? updatedAd : ad,
    );
    setAds(updatedAds);
    setSelectedAd(updatedAd);
    saveAdsToLocalStorage(updatedAds); // Save to localStorage

    toast({
      title: "Ad saved",
      description: `"${updatedAd.name}" has been saved successfully`,
      variant: "success",
    });
  };

  const handleImportAds = (importedAds) => {
    // Add type if missing in imported ads
    const processedAds = importedAds.map((ad) => ({
      ...ad,
      type: ad.type || "search", // Default to search if type is missing
      sitelinks: ad.sitelinks || [], // Ensure sitelinks exists
    }));

    // Merge imported ads with existing ads, avoiding duplicates by ID
    const existingIds = new Set(ads.map((ad) => ad.id));
    const newAds = processedAds.filter((ad) => !existingIds.has(ad.id));
    const updatedAds = [...ads, ...newAds];

    setAds(updatedAds);
    saveAdsToLocalStorage(updatedAds); // Save to localStorage

    if (newAds.length > 0 && !selectedAd) {
      setSelectedAd(newAds[0]);
    }
  };

  const renderContent = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd ? (
          <div className="w-full">
            <AdForm
              ad={selectedAd}
              onSave={handleSaveAd}
              onPreview={() => setSidebarView("previews")}
            />
          </div>
        ) : (
          <AdList
            ads={ads}
            onSelect={handleSelectAd}
            onClone={handleCloneAd}
            onDelete={handleDeleteAd}
          />
        );
      case "previews":
        return (
          <AdPreview
            ad={selectedAd || (ads.length > 0 ? ads[0] : null)}
            allAds={ads}
            onSelectAd={setSelectedAd}
          />
        );
      case "dashboard":
      default:
        return (
          <AdList
            ads={ads}
            onSelect={handleSelectAd}
            onClone={handleCloneAd}
            onDelete={handleDeleteAd}
          />
        );
    }
  };

  const getHeaderTitle = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd ? "Edit Ad" : "All Ads";
      case "previews":
        return "Ad Previews";
      case "settings":
        return "Settings";
      case "help":
        return "Help";
      case "dashboard":
      default:
        return "Dashboard";
    }
  };

  const getHeaderDescription = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd
          ? "Edit your ad details"
          : "Manage your Google search ads";
      case "previews":
        return "Preview how your ads will appear";
      case "settings":
        return "Configure your account settings";
      case "help":
        return "Get help with using the platform";
      case "dashboard":
      default:
        return "Overview of your Google search ads";
    }
  };

  return (
    <DashboardLayout
      onAddNew={handleAddAd}
      activeView={sidebarView}
      onViewChange={setSidebarView}
    >
      <div className="w-full max-w-full">
        <DashboardHeader
          heading={getHeaderTitle()}
          description={getHeaderDescription()}
          onAddNew={
            sidebarView === "dashboard" ||
            (sidebarView === "ads" && !selectedAd)
              ? handleAddAd
              : undefined
          }
          showBackButton={sidebarView === "ads" && selectedAd !== null}
          onBack={() => {
            setSelectedAd(null);
          }}
          ads={ads}
          onImport={handleImportAds}
          showImportExport={
            sidebarView === "dashboard" ||
            (sidebarView === "ads" && !selectedAd)
          }
        />

        <div className="w-full flex-1">{renderContent()}</div>
      </div>
    </DashboardLayout>
  );
}
